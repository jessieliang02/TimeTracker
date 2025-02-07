export interface TabActivity {
    tabId: string;
    url: string;
    title: string;
    category: string;
    startTime: number;
    duration: number;
}

export interface DailyStats {
    date: string;
    categories: {
        [category: string]: {
            totalTime: number;
            visitCount: number;
        }
    }
}

export interface TabInfo {
    id: number;
    url: string;
    title: string;
}

export interface StorageData {
    activities: TabActivity[];
    dailyStats: { [date: string]: DailyStats };
    settings: UserSettings;
}

export interface UserSettings {
    categories: string[];
    customCategories: { [domain: string]: string };
    retentionDays: number;
}

export interface BrowserAdapter {
    trackTab(tabId: string): void;
    getActiveTab(): Promise<TabInfo>;
    onTabChange(callback: (tab: TabInfo) => void): void;
    onTabRemoved(callback: (tabId: number) => void): void;
} 