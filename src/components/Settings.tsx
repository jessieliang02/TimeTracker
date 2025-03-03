import React, { useState, useEffect } from 'react';
import { StorageManager } from '@/utils/storage';
import { UrlCategorizer } from '@/utils/url_categorizer';
import { UserSettings } from '@/types';
import { CategoryManager } from './CategoryManager';

const storage = StorageManager.getInstance();
const categorizer = UrlCategorizer.getInstance();

interface CustomCategoryEntry {
    domain: string;
    category: string;
}

export function Settings() {
    const [settings, setSettings] = useState<UserSettings | null>(null);
    const [newDomain, setNewDomain] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [customEntries, setCustomEntries] = useState<CustomCategoryEntry[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        loadSettings();
        setCategories(categorizer.getCategories());
    }, []);

    const loadSettings = async () => {
        const userSettings = await storage.getSettings();
        setSettings(userSettings);
        setCategories(userSettings.categories);
        
        // Convert custom categories object to array for table display
        const entries = Object.entries(userSettings.customCategories).map(([domain, category]) => ({
            domain,
            category
        }));
        setCustomEntries(entries);
    };

    const handleAddCustomCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDomain || !selectedCategory || !settings) {
            setError('Please fill in both domain and category');
            return;
        }

        try {
            // Validate domain format
            const domainPattern = /^[a-zA-Z0-9][a-zA-Z0-9-_.]+\.[a-zA-Z]{2,}$/;
            if (!domainPattern.test(newDomain)) {
                setError('Invalid domain format');
                return;
            }

            // Update settings
            const updatedCustomCategories = {
                ...settings.customCategories,
                [newDomain]: selectedCategory
            };

            // Save to storage
            await storage.updateSettings({
                customCategories: updatedCustomCategories
            });

            // Update local state
            setCustomEntries([...customEntries, { domain: newDomain, category: selectedCategory }]);
            setNewDomain('');
            setSelectedCategory('');
            setError('');

            // Clear categorizer cache to apply new rules immediately
            categorizer.clearCache();
        } catch (err) {
            setError('Failed to save custom category');
        }
    };

    const handleRemoveCustomCategory = async (domain: string) => {
        if (!settings) return;

        try {
            const updatedCustomCategories = { ...settings.customCategories };
            delete updatedCustomCategories[domain];

            // Save to storage
            await storage.updateSettings({
                customCategories: updatedCustomCategories
            });

            // Update local state
            setCustomEntries(customEntries.filter(entry => entry.domain !== domain));
            categorizer.clearCache();
        } catch (err) {
            setError('Failed to remove custom category');
        }
    };

    const handleCategoriesChange = (newCategories: string[]) => {
        setCategories(newCategories);
        setError('');
    };

    if (!settings) {
        return <div className="p-4">Loading settings...</div>;
    }

    return (
        <div className="p-4 space-y-8">
            <CategoryManager 
                categories={categories}
                onCategoriesChange={handleCategoriesChange}
            />

            <div className="pt-4 border-t">
                <h2 className="text-lg font-semibold mb-4">Custom URL Categories</h2>
                
                <form onSubmit={handleAddCustomCategory} className="space-y-4 mb-6">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-1">Domain</label>
                            <input
                                type="text"
                                value={newDomain}
                                onChange={(e) => setNewDomain(e.target.value)}
                                placeholder="example.com"
                                className="w-full px-3 py-2 border rounded-md"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-1">Category</label>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md"
                            >
                                <option value="">Select category</option>
                                {categories.map(category => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                type="submit"
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
                            >
                                Add
                            </button>
                        </div>
                    </div>
                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}
                </form>

                <div className="border rounded-md">
                    <table className="w-full">
                        <thead className="bg-muted">
                            <tr>
                                <th className="px-4 py-2 text-left">Domain</th>
                                <th className="px-4 py-2 text-left">Category</th>
                                <th className="px-4 py-2 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customEntries.map(({ domain, category }) => (
                                <tr key={domain} className="border-t">
                                    <td className="px-4 py-2">{domain}</td>
                                    <td className="px-4 py-2">{category}</td>
                                    <td className="px-4 py-2 text-right">
                                        <button
                                            onClick={() => handleRemoveCustomCategory(domain)}
                                            className="text-sm text-destructive hover:opacity-80"
                                        >
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {customEntries.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-4 py-4 text-center text-muted-foreground">
                                        No custom categories added
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
} 