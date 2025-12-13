"use client";

import { useEffect, useState } from 'react';
import { Filter, SortAsc } from 'lucide-react';
import { ProductFilters } from '@/lib/types';

interface FilterSortProps {
    availableCategories: string[];
    filters: ProductFilters;
    onFilterChange: (newFilters: ProductFilters) => void;
}

export default function ShopFilterSort({ availableCategories, filters, onFilterChange }: FilterSortProps) {
    // Local state for price slider to allow smooth dragging without triggering fetch on every pixel
    const [localMinPrice, setLocalMinPrice] = useState(filters.minPrice ?? 50);
    const [localMaxPrice, setLocalMaxPrice] = useState(filters.maxPrice ?? 2000);

    // Sync local state if parent updates filters (e.g. URL params or reset)
    useEffect(() => {
        setLocalMinPrice(filters.minPrice ?? 50);
        setLocalMaxPrice(filters.maxPrice ?? 2000);
    }, [filters.minPrice, filters.maxPrice]);

    const handleCategoryChange = (val: string) => {
        onFilterChange({ ...filters, category: val === "All" ? undefined : val, page: 1 });
    };

    const handleSortChange = (val: string) => {
        onFilterChange({ ...filters, sort: val as any, page: 1 });
    };

    const handlePriceCommit = () => {
        if (localMinPrice !== filters.minPrice || localMaxPrice !== filters.maxPrice) {
            onFilterChange({ ...filters, minPrice: localMinPrice, maxPrice: localMaxPrice, page: 1 });
        }
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 mb-6 transition-shadow hover:shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center">
                        <Filter className="w-4 h-4 mr-2" />
                        Category
                    </label>
                    <select
                        value={filters.category || "All"}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="All">All Categories</option>
                        {availableCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center justify-between">
                        <span className="flex items-center">
                            <Filter className="w-4 h-4 mr-2" />
                            Price Range
                        </span>
                        <span className="text-indigo-600 font-semibold">₹{localMinPrice} - ₹{localMaxPrice}</span>
                    </label>
                    <div className="pt-4 pb-2 px-2">
                        <div className="relative h-2">
                            {/* Track */}
                            <div className="absolute w-full h-2 bg-slate-200 rounded-full"></div>
                            {/* Active range */}
                            <div
                                className="absolute h-2 bg-indigo-600 rounded-full"
                                style={{
                                    left: `${((localMinPrice - 50) / (2000 - 50)) * 100}%`,
                                    right: `${100 - ((localMaxPrice - 50) / (2000 - 50)) * 100}%`
                                }}
                            ></div>
                            {/* Min slider */}
                            <input
                                type="range"
                                min={50}
                                max={2000}
                                step={50}
                                value={localMinPrice}
                                onChange={(e) => {
                                    const value = Number(e.target.value);
                                    if (value < localMaxPrice) setLocalMinPrice(value);
                                }}
                                onMouseUp={handlePriceCommit}
                                onTouchEnd={handlePriceCommit}
                                className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-indigo-600 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md"
                            />
                            {/* Max slider */}
                            <input
                                type="range"
                                min={50}
                                max={2000}
                                step={50}
                                value={localMaxPrice}
                                onChange={(e) => {
                                    const value = Number(e.target.value);
                                    if (value > localMinPrice) setLocalMaxPrice(value);
                                }}
                                onMouseUp={handlePriceCommit}
                                onTouchEnd={handlePriceCommit}
                                className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-indigo-600 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md"
                            />
                        </div>
                        <div className="flex justify-between text-xs text-slate-500 mt-3">
                            <span>₹50</span>
                            <span>₹2000</span>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center">
                        <SortAsc className="w-4 h-4 mr-2" />
                        Sort By
                    </label>
                    <select
                        value={filters.sort || "newest"}
                        onChange={(e) => handleSortChange(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="newest">Newest Arrivals</option>
                        <option value="name_asc">Name (A-Z)</option>
                        <option value="price_asc">Price (Low to High)</option>
                        <option value="price_desc">Price (High to Low)</option>
                    </select>
                </div>
            </div>
        </div>
    );
}
