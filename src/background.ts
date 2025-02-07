import { TabActivity } from '@/types';
import { StorageManager } from '@/utils/storage';

interface ActiveTab {
    id: number;
    url: string;
    title: string;
    startTime: number;
}

let activeTab: ActiveTab | null = null;
const storage = StorageManager.getInstance();

function getDomainFromUrl(url: string): string {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname;
    } catch {
        return 'unknown';
    }
}

async function categorizeUrl(url: string): Promise<string> {
    const settings = await storage.getSettings();
    const domain = getDomainFromUrl(url);
    
    // Check custom categories first
    if (settings.customCategories[domain]) {
        return settings.customCategories[domain];
    }

    // Basic categorization logic
    if (domain.includes('github.com') || domain.includes('gitlab.com')) {
        return 'Work';
    } else if (domain.includes('facebook.com') || domain.includes('twitter.com') || domain.includes('instagram.com')) {
        return 'Social';
    } else if (domain.includes('youtube.com') || domain.includes('netflix.com')) {
        return 'Entertainment';
    } else if (domain.includes('amazon.com') || domain.includes('ebay.com')) {
        return 'Shopping';
    }

    return 'Other';
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

// Initialize storage
storage.initialize().catch(console.error);

// Listen for tab activation
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab && tab.url && tab.title) {
        await handleTabChange(tab.id!, tab.url, tab.title);
    }
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.active && tab.url && tab.title) {
        handleTabChange(tabId, tab.url, tab.title).catch(console.error);
    }
});

// Listen for window focus changes
chrome.windows.onFocusChanged.addListener(async (windowId) => {
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
chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'syncStats' && activeTab) {
        await recordTabActivity(activeTab);
        activeTab = {
            ...activeTab,
            startTime: Date.now()
        };
    }
}); 