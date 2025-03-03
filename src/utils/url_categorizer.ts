import defaultCategories from '@/data/default_categories.json';

interface CategoryPattern {
    patterns: string[];
}

interface CategoryRules {
    [category: string]: CategoryPattern;
}

interface CacheEntry {
    category: string;
    timestamp: number;
}

export class UrlCategorizer {
    private static instance: UrlCategorizer;
    private categoryPatterns: Map<string, RegExp[]>;
    private cache: Map<string, CacheEntry>;
    private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    private readonly MAX_CACHE_SIZE = 1000;

    private constructor() {
        this.categoryPatterns = new Map();
        this.cache = new Map();
        this.initializePatterns();
    }

    static getInstance(): UrlCategorizer {
        if (!UrlCategorizer.instance) {
            UrlCategorizer.instance = new UrlCategorizer();
        }
        return UrlCategorizer.instance;
    }

    private initializePatterns(): void {
        const categories = defaultCategories.categories as CategoryRules;
        
        for (const [category, { patterns }] of Object.entries(categories)) {
            this.categoryPatterns.set(
                category,
                patterns.map(pattern => new RegExp(pattern))
            );
        }
    }

    private getDomainFromUrl(url: string): string {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.toLowerCase();
        } catch {
            return '';
        }
    }

    private cleanCache(): void {
        const now = Date.now();
        
        // Remove expired entries
        for (const [domain, entry] of this.cache.entries()) {
            if (now - entry.timestamp > this.CACHE_DURATION) {
                this.cache.delete(domain);
            }
        }

        // If still too large, remove oldest entries
        if (this.cache.size > this.MAX_CACHE_SIZE) {
            const sortedEntries = Array.from(this.cache.entries())
                .sort((a, b) => a[1].timestamp - b[1].timestamp);
            
            const entriesToRemove = sortedEntries.slice(0, sortedEntries.length - this.MAX_CACHE_SIZE);
            for (const [domain] of entriesToRemove) {
                this.cache.delete(domain);
            }
        }
    }

    async categorizeUrl(url: string, userCategories?: { [domain: string]: string }): Promise<string> {
        const domain = this.getDomainFromUrl(url);
        if (!domain) return 'Other';

        // Check user-defined categories first
        if (userCategories?.[domain]) {
            return userCategories[domain];
        }

        // Check cache
        const cachedResult = this.cache.get(domain);
        if (cachedResult && Date.now() - cachedResult.timestamp <= this.CACHE_DURATION) {
            return cachedResult.category;
        }

        // Match against patterns
        for (const [category, patterns] of this.categoryPatterns.entries()) {
            for (const pattern of patterns) {
                if (pattern.test(domain)) {
                    // Cache the result
                    this.cache.set(domain, {
                        category,
                        timestamp: Date.now()
                    });
                    this.cleanCache();
                    return category;
                }
            }
        }

        // Cache the default result
        this.cache.set(domain, {
            category: 'Other',
            timestamp: Date.now()
        });
        this.cleanCache();
        return 'Other';
    }

    addCustomPattern(category: string, pattern: string): void {
        const existingPatterns = this.categoryPatterns.get(category) || [];
        try {
            const newPattern = new RegExp(pattern);
            this.categoryPatterns.set(category, [...existingPatterns, newPattern]);
        } catch (error) {
            console.error('Invalid regex pattern:', error);
            throw new Error('Invalid pattern format');
        }
    }

    clearCache(): void {
        this.cache.clear();
    }

    getCategories(): string[] {
        return Array.from(this.categoryPatterns.keys());
    }
} 