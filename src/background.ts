import { TabActivity } from '@/types';
import { StorageManager } from '@/utils/storage';
import { UrlCategorizer } from '@/utils/url_categorizer';

interface ActiveTab {
    id: number;
    url: string;
    title: string;
    startTime: number;
}

let activeTab: ActiveTab | null = null;
const storage = StorageManager.getInstance();
const categorizer = UrlCategorizer.getInstance();

async function categorizeUrl(url: string): Promise<string> {
    const settings = await storage.getSettings();
    return categorizer.categorizeUrl(url, settings.customCategories);
}

async function recordTabActivity(tab: ActiveTab): Promise<void> {
    if (!tab.url || tab.url.startsWith('chrome://')) return;

    const activity: TabActivity = {
        tabId: tab.id.toString(),
        url: tab.url,
        title: tab.title,
        category: await categorizeUrl(tab.url),
        startTime: tab.startTime,
        duration: Date.now() - tab.startTime
    };

    await storage.addActivity(activity);
}

async function handleTabChange(tabId: number, url: string, title: string): Promise<void> {
    if (activeTab) {
        await recordTabActivity(activeTab);
    }

    if (!url || url.startsWith('chrome://')) {
        activeTab = null;
        return;
    }

    activeTab = {
        id: tabId,
        url,
        title,
        startTime: Date.now()
    };
}

// Initialize storage and load patterns
Promise.all([
    storage.initialize(),
]).catch(console.error);

// Listen for tab activation
chrome.tabs.onActivated.addListener(async (activeInfo: chrome.tabs.TabActiveInfo) => {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab && tab.url && tab.title) {
        await handleTabChange(tab.id!, tab.url, tab.title);
    }
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener((
    tabId: number,
    changeInfo: chrome.tabs.TabChangeInfo,
    tab: chrome.tabs.Tab
) => {
    if (changeInfo.status === 'complete' && tab.active && tab.url && tab.title) {
        handleTabChange(tabId, tab.url, tab.title).catch(console.error);
    }
});

// Listen for window focus changes
chrome.windows.onFocusChanged.addListener(async (windowId: number) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
        if (activeTab) {
            await recordTabActivity(activeTab);
            activeTab = null;
        }
    } else {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.id && tab.url && tab.title) {
            await handleTabChange(tab.id, tab.url, tab.title);
        }
    }
});

// Set up periodic sync
chrome.alarms.create('syncStats', { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener(async (alarm: chrome.alarms.Alarm) => {
    if (alarm.name === 'syncStats' && activeTab) {
        await recordTabActivity(activeTab);
        activeTab = {
            ...activeTab,
            startTime: Date.now()
        };
    }
}); 