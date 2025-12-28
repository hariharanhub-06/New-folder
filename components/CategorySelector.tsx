"use client";

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Loader2, RefreshCw } from 'lucide-react';
import { getCategories } from '@/lib/api';
import { deleteCategory } from '@/lib/actions';

interface CategorySelectorProps {
    currentCategory: string;
    onCategoryChange: (category: string) => void;
}

export default function CategorySelector({ currentCategory, onCategoryChange }: CategorySelectorProps) {
    const [availableCategories, setAvailableCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        try {
            const fetched = await getCategories();
            setAvailableCategories(fetched);
        } catch (error) {
            console.error("Failed to fetch categories:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    return (
        <div className="space-y-2">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>

            <div className="relative">
                <select
                    id="category_select"
                    value={currentCategory}
                    onChange={(e) => onCategoryChange(e.target.value)}
                    disabled={loading}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 appearance-none bg-white"
                >
                    {availableCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>

                {/* Loading Indicator */}
                {loading && (
                    <div className="absolute right-8 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    </div>
                )}
            </div>
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
