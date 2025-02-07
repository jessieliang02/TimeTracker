import { StorageData, TabActivity, DailyStats, UserSettings } from '@/types';

const DEFAULT_SETTINGS: UserSettings = {
    categories: ['Work', 'Social', 'Entertainment', 'Shopping', 'Other'],
    customCategories: {},
    retentionDays: 30
};

const INITIAL_STORAGE: StorageData = {
    activities: [],
    dailyStats: {},
    settings: DEFAULT_SETTINGS
};

export class StorageManager {
    private static instance: StorageManager;

    private constructor() {}

    static getInstance(): StorageManager {
        if (!StorageManager.instance) {
            StorageManager.instance = new StorageManager();
        }
        return StorageManager.instance;
    }

    async initialize(): Promise<void> {
        const data = await this.getData();
        if (!data) {
            await this.setData(INITIAL_STORAGE);
        }
    }

    async getData(): Promise<StorageData | null> {
        return new Promise((resolve) => {
            chrome.storage.local.get(null, (items: { [key: string]: any }) => {
                if (!items || !items.activities || !items.dailyStats || !items.settings) {
                    resolve(null);
                    return;
                }
                
                const data: StorageData = {
                    activities: items.activities as TabActivity[],
                    dailyStats: items.dailyStats as { [date: string]: DailyStats },
                    settings: items.settings as UserSettings
                };
                resolve(data);
            });
        });
    }

    async setData(data: StorageData): Promise<void> {
        return new Promise((resolve) => {
            chrome.storage.local.set(data, () => {
                resolve();
            });
        });
    }

    async addActivity(activity: TabActivity): Promise<void> {
        const data = await this.getData();
        if (!data) return;

        const today = new Date().toISOString().split('T')[0];
        
        // Update activities
        data.activities.push(activity);

        // Update daily stats
        if (!data.dailyStats[today]) {
            data.dailyStats[today] = {
                date: today,
                categories: {}
            };
        }

        const categoryStats = data.dailyStats[today].categories[activity.category] || {
            totalTime: 0,
            visitCount: 0
        };

        categoryStats.totalTime += activity.duration;
        categoryStats.visitCount += 1;
        data.dailyStats[today].categories[activity.category] = categoryStats;

        // Clean up old data
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - data.settings.retentionDays);
        const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

        data.activities = data.activities.filter(a => {
            const activityDate = new Date(a.startTime).toISOString().split('T')[0];
            return activityDate >= cutoffDateStr;
        });

        Object.keys(data.dailyStats).forEach(date => {
            if (date < cutoffDateStr) {
                delete data.dailyStats[date];
            }
        });

        await this.setData(data);
    }

    async getDailyStats(date: string): Promise<DailyStats | null> {
        const data = await this.getData();
        return data?.dailyStats[date] || null;
    }

    async getSettings(): Promise<UserSettings> {
        const data = await this.getData();
        return data?.settings || DEFAULT_SETTINGS;
    }

    async updateSettings(settings: Partial<UserSettings>): Promise<void> {
        const data = await this.getData();
        if (!data) return;

        data.settings = {
            ...data.settings,
            ...settings
        };

        await this.setData(data);
    }
} 