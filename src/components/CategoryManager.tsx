import React, { useState } from 'react';
import { StorageManager } from '@/utils/storage';
import { UrlCategorizer } from '@/utils/url_categorizer';

const storage = StorageManager.getInstance();
const categorizer = UrlCategorizer.getInstance();

interface CategoryManagerProps {
    categories: string[];
    onCategoriesChange: (categories: string[]) => void;
}

export function CategoryManager({ categories, onCategoriesChange }: CategoryManagerProps) {
    const [newCategory, setNewCategory] = useState('');
    const [error, setError] = useState('');

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategory.trim()) {
            setError('Please enter a category name');
            return;
        }

        // Validate category name
        const categoryPattern = /^[a-zA-Z0-9][a-zA-Z0-9\s\-_\.#@&!]{1,24}$/;
        if (!categoryPattern.test(newCategory)) {
            setError('Category must start with a letter or number and be 1-25 characters long');
            return;
        }

        if (categories.includes(newCategory)) {
            setError('Category already exists');
            return;
        }

        try {
            const updatedCategories = [...categories, newCategory];
            await storage.updateSettings({ categories: updatedCategories });
            onCategoriesChange(updatedCategories);
            setNewCategory('');
            setError('');
        } catch (err) {
            setError('Failed to add category');
        }
    };

    const handleRemoveCategory = async (category: string) => {
        // Don't allow removing default categories
        const defaultCategories = ['Work', 'Social', 'Entertainment', 'Shopping', 'News', 'Education', 'Other'];
        if (defaultCategories.includes(category)) {
            setError('Cannot remove default categories');
            return;
        }

        try {
            const updatedCategories = categories.filter(c => c !== category);
            await storage.updateSettings({ categories: updatedCategories });
            onCategoriesChange(updatedCategories);
            setError('');
        } catch (err) {
            setError('Failed to remove category');
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-4">Category Management</h2>

            <form onSubmit={handleAddCategory} className="flex gap-4 mb-4">
                <div className="flex-1">
                    <input
                        type="text"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="New Category Name"
                        className="w-full px-3 py-2 border rounded-md"
                    />
                </div>
                <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
                >
                    Add Category
                </button>
            </form>

            {error && (
                <p className="text-sm text-destructive mb-4">{error}</p>
            )}

            <div className="border rounded-md">
                <table className="w-full">
                    <thead className="bg-muted">
                        <tr>
                            <th className="px-4 py-2 text-left">Category Name</th>
                            <th className="px-4 py-2 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.map((category) => (
                            <tr key={category} className="border-t">
                                <td className="px-4 py-2">{category}</td>
                                <td className="px-4 py-2 text-right">
                                    <button
                                        onClick={() => handleRemoveCategory(category)}
                                        className="text-sm text-destructive hover:opacity-80"
                                        disabled={['Work', 'Social', 'Entertainment', 'Shopping', 'News', 'Education', 'Other'].includes(category)}
                                    >
                                        Remove
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
} 