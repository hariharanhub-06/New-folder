"use client";

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Loader2, RefreshCw } from 'lucide-react';
import { PRODUCT_CATEGORIES } from '@/lib/constants';
import { getCategories } from '@/lib/api';
import { deleteCategory } from '@/lib/actions';

interface CategorySelectorProps {
    currentCategory: string;
    onCategoryChange: (category: string) => void;
}

export default function CategorySelector({ currentCategory, onCategoryChange }: CategorySelectorProps) {
    const [availableCategories, setAvailableCategories] = useState<string[]>([...PRODUCT_CATEGORIES]);
    const [isCustomInput, setIsCustomInput] = useState(false);
    const [customCategory, setCustomCategory] = useState('');
    const [loading, setLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Initial check for custom input mode
    useEffect(() => {
        if (currentCategory && !PRODUCT_CATEGORIES.includes(currentCategory as any) && !availableCategories.includes(currentCategory)) {
            // If current category is not in defaults, and not yet in loaded list (which starts as defaults),
            // it might be a custom one. But wait for fetch to confirm.
            // Actually, if it's not a known constant, treat as custom string input for now
            if (!PRODUCT_CATEGORIES.includes(currentCategory as any)) {
                // It's a custom category. We might want to just select it if it exists in DB, 
                // or show input if it's brand new.
                // Simpler: If it's not in the dropdown list, show input? 
                // No, better to wait for list load.
            }
        }
    }, [availableCategories, currentCategory]);

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        try {
            const fetched = await getCategories();
            const uniqueCategories = Array.from(new Set([...PRODUCT_CATEGORIES, ...fetched])).sort();
            setAvailableCategories(uniqueCategories);

            // Logic to determine if we should show input or select dropdown
            if (currentCategory && !uniqueCategories.includes(currentCategory)) {
                // Probably a new entry or uncached.
                // For now, let's trust the prop.
            }
        } catch (error) {
            console.error("Failed to fetch categories:", error);
        } finally {
            setLoading(false);
        }
    }, [currentCategory]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleDelete = async () => {
        if (!currentCategory || PRODUCT_CATEGORIES.includes(currentCategory as any)) {
            alert("Cannot delete default categories.");
            return;
        }

        if (!confirm(`Are you sure you want to delete the category "${currentCategory}"? All products in this category will be marked as 'Uncategorized'.`)) {
            return;
        }

        setIsDeleting(true);
        try {
            await deleteCategory(currentCategory);
            // Refresh list
            await fetchCategories();
            // Reset selection
            onCategoryChange('Shirt'); // Default fallback
            alert("Category deleted successfully.");
        } catch (error) {
            console.error("Delete failed:", error);
            alert("Failed to delete category.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === 'new') {
            setIsCustomInput(true);
            onCategoryChange('');
        } else {
            setIsCustomInput(false);
            onCategoryChange(value);
        }
    };

    return (
        <div className="space-y-2">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>

            <div className="flex gap-2">
                {!isCustomInput ? (
                    <div className="relative flex-1">
                        <select
                            id="category_select"
                            value={availableCategories.includes(currentCategory) ? currentCategory : 'new'}
                            onChange={handleSelectChange}
                            disabled={loading || isDeleting}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 appearance-none bg-white"
                        >
                            {/* Show current category even if not in list yet (rare case) */}
                            {currentCategory && !availableCategories.includes(currentCategory) && !isCustomInput && (
                                <option value={currentCategory}>{currentCategory}</option>
                            )}

                            {availableCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                            <option value="new">+ Create New Category</option>
                        </select>

                        {/* Loading Indicator */}
                        {loading && (
                            <div className="absolute right-8 top-1/2 -translate-y-1/2">
                                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 flex gap-2">
                        <input
                            type="text"
                            placeholder="Enter new category name"
                            value={currentCategory} // When in custom mode, parent state holds the typing
                            onChange={(e) => onCategoryChange(e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                            autoFocus
                        />
                        <button
                            type="button"
                            onClick={() => {
                                setIsCustomInput(false);
                                onCategoryChange(availableCategories[0] || 'Shirt');
                            }}
                            className="px-3 py-2 text-gray-500 hover:text-gray-700 bg-gray-100 rounded-md transition-colors"
                            title="Cancel"
                        >
                            <XWrap />
                        </button>
                    </div>
                )}

                {/* Delete Button - Only show if selected category is custom and we are not in 'new' mode */}
                {!isCustomInput && currentCategory && !PRODUCT_CATEGORIES.includes(currentCategory as any) && (
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="px-3 py-2 text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-md transition-colors border border-red-200"
                        title="Delete this category"
                    >
                        {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                    </button>
                )}
            </div>

            {/* Helper text */}
            {isCustomInput && (
                <p className="text-xs text-gray-500">Type the name of your new category.</p>
            )}
        </div>
    );
}

// Helper icon component to avoid huge lucide import if possible, or just used above.
// Actually X is already imported in other files, let's use it.
function XWrap() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" /><path d="m6 6 18 18" />
        </svg>
    );
}
