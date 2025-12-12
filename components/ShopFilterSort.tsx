"use client";

import { Product } from '@/lib/types';
import { useState, useEffect } from 'react';
import { Filter, SortAsc } from 'lucide-react';

interface FilterSortProps {
    products: Product[];
    availableCategories: string[];
    onFilterSort: (filtered: Product[]) => void;
}

export default function ShopFilterSort({ products, availableCategories, onFilterSort }: FilterSortProps) {
    const [category, setCategory] = useState<string>("All");
    const [sortBy, setSortBy] = useState<string>("name");
    const [minPrice, setMinPrice] = useState(50);
    const [maxPrice, setMaxPrice] = useState(2000);

    // Apply filters whenever filter options change
    useEffect(() => {
        let filtered = [...products];

        // Filter by category
        if (category !== "All") {
            filtered = filtered.filter(p => p.category === category);
        }

        // Filter by price range
        filtered = filtered.filter(p => p.price >= minPrice && p.price <= maxPrice);

        // Sort
        if (sortBy === "name") {
            filtered.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortBy === "price-low") {
            filtered.sort((a, b) => a.price - b.price);
        } else if (sortBy === "price-high") {
            filtered.sort((a, b) => b.price - a.price);
        }

        onFilterSort(filtered);
    }, [category, sortBy, minPrice, maxPrice, products, onFilterSort]);

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 mb-6 transition-shadow hover:shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center">
                        <Filter className="w-4 h-4 mr-2" />
                        Category
                    </label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
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
                        <span className="text-indigo-600 font-semibold">₹{minPrice} - ₹{maxPrice}</span>
                    </label>
                    <div className="pt-4 pb-2 px-2">
                        <div className="relative h-2">
                            {/* Track */}
                            <div className="absolute w-full h-2 bg-slate-200 rounded-full"></div>
                            {/* Active range */}
                            <div
                                className="absolute h-2 bg-indigo-600 rounded-full"
                                style={{
                                    left: `${((minPrice - 50) / (2000 - 50)) * 100}%`,
                                    right: `${100 - ((maxPrice - 50) / (2000 - 50)) * 100}%`
                                }}
                            ></div>
                            {/* Min slider */}
                            <input
                                type="range"
                                min={50}
                                max={2000}
                                step={50}
                                value={minPrice}
                                onChange={(e) => {
                                    const value = Number(e.target.value);
                                    if (value < maxPrice) {
                                        setMinPrice(value);
                                    }
                                }}
                                className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-indigo-600 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md"
                            />
                            {/* Max slider */}
                            <input
                                type="range"
                                min={50}
                                max={2000}
                                step={50}
                                value={maxPrice}
                                onChange={(e) => {
                                    const value = Number(e.target.value);
                                    if (value > minPrice) {
                                        setMaxPrice(value);
                                    }
                                }}
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
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="name">Name (A-Z)</option>
                        <option value="price-low">Price (Low to High)</option>
                        <option value="price-high">Price (High to Low)</option>
                    </select>
                </div>
            </div>
        </div>
    );
}
