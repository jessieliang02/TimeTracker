import { BrowserAdapter, TabInfo } from '@/types';

declare global {
    interface Window {
        chrome: typeof chrome;
    }
}

export class ChromeAdapter implements BrowserAdapter {
    async trackTab(tabId: string): Promise<void> {
        // Implementation handled by background script
    }

    async getActiveTab(): Promise<TabInfo> {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.id) {
            throw new Error('No active tab found');
        }
        return {
            id: tab.id,
            url: tab.url || '',
            title: tab.title || ''
        };
    }

    onTabChange(callback: (tab: TabInfo) => void): void {
        chrome.tabs.onActivated.addListener(async (activeInfo: chrome.tabs.TabActiveInfo) => {
            const tab = await chrome.tabs.get(activeInfo.tabId);
            if (tab && tab.id) {
                callback({
                    id: tab.id,
                    url: tab.url || '',
                    title: tab.title || ''
                });
            }
        });

        chrome.tabs.onUpdated.addListener((
            tabId: number,
            changeInfo: chrome.tabs.TabChangeInfo,
            tab: chrome.tabs.Tab
        ) => {
            if (changeInfo.status === 'complete' && tab.active && tab.id) {
                callback({
                    id: tab.id,
                    url: tab.url || '',
                    title: tab.title || ''
                });
            }
        });
    }

    onTabRemoved(callback: (tabId: number) => void): void {
        chrome.tabs.onRemoved.addListener((tabId: number) => {
            callback(tabId);
        });
    }
} 