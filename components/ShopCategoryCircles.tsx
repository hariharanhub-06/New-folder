"use client";

import Image from 'next/image';
import { ChevronRight } from 'lucide-react';

interface Category {
    id: string;
    name: string;
    image_url?: string;
    product_count?: number;
}

interface ShopCategoryCirclesProps {
    categories: Category[];
    selectedCategory?: string;
    onSelectCategory: (category: string) => void;
}

export default function ShopCategoryCircles({ categories, selectedCategory, onSelectCategory }: ShopCategoryCirclesProps) {
    if (!categories || categories.length === 0) return null;

    return (
        <div className="mb-12">
            <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-normal text-black mb-3">Shop by Categories</h2>
                <p className="text-gray-500 text-sm md:text-base max-w-2xl mx-auto">
                    Explore our refined categories for a seamless shopping experience.
                </p>
            </div>

            <div className="flex flex-wrap justify-center gap-8 md:gap-12 px-4">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => onSelectCategory(cat.name)}
                        className="group flex flex-col items-center focus:outline-none"
                    >
                        <div className="relative">
                            {cat.product_count !== undefined && cat.product_count > 0 && (
                                <div className="absolute -top-1 -right-1 z-20 bg-brand-red text-white text-[10px] md:text-xs font-black px-2 py-0.5 rounded-full shadow-lg ring-2 ring-white animate-in zoom-in duration-300">
                                    {cat.product_count}
                                </div>
                            )}
                            <div className={`relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 transition-all duration-300 ${selectedCategory === cat.name
                                ? 'border-black ring-4 ring-black/5 scale-105'
                                : 'border-transparent group-hover:border-gray-200 group-hover:scale-105'
                                }`}>
                                {cat.image_url ? (
                                    <Image
                                        src={cat.image_url}
                                        alt={cat.name}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                                        sizes="(max-width: 768px) 100px, 150px"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs uppercase font-bold">
                                        {cat.name.substring(0, 2)}
                                    </div>
                                )}
                            </div>
                        </div>
                        <span className={`mt-4 text-sm md:text-base font-medium tracking-wide transition-colors ${selectedCategory === cat.name ? 'text-black font-bold' : 'text-gray-600 group-hover:text-black'
                            }`}>
                            {cat.name}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
