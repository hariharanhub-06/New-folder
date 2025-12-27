"use client";

import { Tag, Shirt, Scissors, Footprints, Watch, LayoutGrid } from "lucide-react";

interface ShopCategoryPillsProps {
    categories: any[];
    selectedCategory: string | undefined;
    onSelectCategory: (category: string) => void;
}

export default function ShopCategoryPills({ categories, selectedCategory, onSelectCategory }: ShopCategoryPillsProps) {
    if (!categories) return null;

    // Helper to get icon (simplified for now, can be expanded)
    const getIcon = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes('shirt')) return <Shirt className="w-3 h-3" />;
        if (n.includes('hoodie')) return <Tag className="w-3 h-3" />; // Placeholder
        if (n.includes('trouser') || n.includes('bottom')) return <Scissors className="w-3 h-3" />;
        if (n.includes('shoe') || n.includes('foot')) return <Footprints className="w-3 h-3" />;
        if (n.includes('accessory') || n.includes('watch')) return <Watch className="w-3 h-3" />;
        return <Tag className="w-3 h-3" />;
    };

    return (
        <div className="flex flex-wrap gap-3 mb-8">
            <button
                onClick={() => onSelectCategory('All Categories')}
                className={`flex items-center gap-2 px-4 py-2 border rounded-full text-xs font-bold uppercase tracking-wider transition-all ${!selectedCategory || selectedCategory === 'All Categories' ? "bg-black text-white border-black" : "bg-white text-gray-500 border-gray-200 hover:border-black hover:text-black"}`}
            >
                <LayoutGrid className="w-3 h-3" />
                All Products
            </button>

            {categories.map((cat) => (
                <button
                    key={cat.id || cat.name}
                    onClick={() => onSelectCategory(cat.name)}
                    className={`flex items-center gap-2 px-4 py-2 border rounded-full text-xs font-bold uppercase tracking-wider transition-all ${selectedCategory === cat.name ? "bg-black text-white border-black" : "bg-white text-gray-500 border-gray-200 hover:border-black hover:text-black"}`}
                >
                    {getIcon(cat.name)}
                    {cat.name}
                </button>
            ))}
        </div>
    );
}
