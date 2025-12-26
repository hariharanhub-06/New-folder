"use client";

import { useEffect, useState } from 'react';
import { Filter, SortAsc, Minus, Plus } from 'lucide-react';
import { ProductFilters } from '@/lib/types';

interface SidebarFilterProps {
    filters: ProductFilters;
    onFilterChange: (newFilters: ProductFilters) => void;
}

export default function SidebarFilter({ filters, onFilterChange }: SidebarFilterProps) {
    const [localMinPrice, setLocalMinPrice] = useState(filters.minPrice ?? 50);
    const [localMaxPrice, setLocalMaxPrice] = useState(filters.maxPrice ?? 2000);

    // Collapsible sections state
    const [openSections, setOpenSections] = useState({
        price: true,
        sort: true
    });

    useEffect(() => {
        setLocalMinPrice(filters.minPrice ?? 50);
        setLocalMaxPrice(filters.maxPrice ?? 2000);
    }, [filters.minPrice, filters.maxPrice]);

    const handleSortChange = (val: string) => {
        onFilterChange({ ...filters, sort: val as any, page: 1 });
    };

    const handlePriceCommit = () => {
        if (localMinPrice !== filters.minPrice || localMaxPrice !== filters.maxPrice) {
            onFilterChange({ ...filters, minPrice: localMinPrice, maxPrice: localMaxPrice, page: 1 });
        }
    };

    const toggleSection = (section: keyof typeof openSections) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    return (
        <div className="w-full lg:w-64 flex-shrink-0 space-y-8">
            {/* Price Filter */}
            <div className="border-b border-slate-200 pb-6">
                <button
                    onClick={() => toggleSection('price')}
                    className="flex items-center justify-between w-full mb-4 group"
                >
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Price Filter</h3>
                    {openSections.price ? <Minus className="w-4 h-4 text-slate-500" /> : <Plus className="w-4 h-4 text-slate-500" />}
                </button>

                {openSections.price && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm font-medium text-slate-700">
                            <span>Range:</span>
                            <span className="text-indigo-600">₹{localMinPrice} - ₹{localMaxPrice}</span>
                        </div>

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
                                    className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md"
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
                                    className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Sort Filter */}
            <div className="border-b border-slate-200 pb-6">
                <button
                    onClick={() => toggleSection('sort')}
                    className="flex items-center justify-between w-full mb-4 group"
                >
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Sort By</h3>
                    {openSections.sort ? <Minus className="w-4 h-4 text-slate-500" /> : <Plus className="w-4 h-4 text-slate-500" />}
                </button>

                {openSections.sort && (
                    <div className="space-y-2">
                        {[
                            { label: 'Newest Arrivals', value: 'newest' },
                            { label: 'Name (A-Z)', value: 'name_asc' },
                            { label: 'Price (Low to High)', value: 'price_asc' },
                            { label: 'Price (High to Low)', value: 'price_desc' }
                        ].map((option) => (
                            <label key={option.value} className="flex items-center space-x-3 cursor-pointer group">
                                <input
                                    type="radio"
                                    name="sort"
                                    value={option.value}
                                    checked={createSortValue(filters.sort) === option.value}
                                    onChange={(e) => handleSortChange(e.target.value)}
                                    className="form-radio h-4 w-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                                />
                                <span className="text-slate-600 group-hover:text-slate-900 transition-colors">{option.label}</span>
                            </label>
                        ))}
                    </div>
                )}
            </div>

            {/* Highlights (Static for now based on image) */}
            <div className="border-b border-slate-200 pb-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Highlights</h3>
                <div className="space-y-2">
                    <button className="text-indigo-600 hover:text-indigo-800 text-left w-full font-medium">All Products</button>
                    <button className="text-slate-600 hover:text-slate-900 text-left w-full">Best Sellers</button>
                    <button className="text-slate-600 hover:text-slate-900 text-left w-full">New Arrivals</button>
                    <button className="text-red-500 hover:text-red-700 text-left w-full">Sale</button>
                </div>
            </div>
        </div>
    );
}

function createSortValue(val?: string) {
    return val || 'newest';
}
