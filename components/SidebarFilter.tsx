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
        <div className="w-full lg:w-56 flex-shrink-0 space-y-4">
            {/* Price Filter */}
            <div className="border-b border-slate-200 pb-3">
                <button
                    onClick={() => toggleSection('price')}
                    className="flex items-center justify-between w-full mb-2 group"
                >
                    <h3 className="text-xs font-bold text-black uppercase tracking-widest group-hover:text-brand-red transition-colors">Price</h3>
                    {openSections.price ? <Minus className="w-3 h-3 text-black" /> : <Plus className="w-3 h-3 text-black" />}
                </button>

                {openSections.price && (
                    <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            <span>Range</span>
                            <span className="text-black">₹{localMinPrice} - ₹{localMaxPrice}</span>
                        </div>

                        <div className="pt-2 pb-1 px-1">
                            <div className="relative h-1.5">
                                {/* Track */}
                                <div className="absolute w-full h-1.5 bg-slate-200 rounded-full"></div>
                                {/* Active range */}
                                <div
                                    className="absolute h-1.5 bg-black"
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
                                    className="absolute w-full h-1.5 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:bg-brand-red [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md"
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
                                    className="absolute w-full h-1.5 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:bg-brand-red [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Sort Filter */}
            <div className="border-b border-slate-200 pb-3">
                <button
                    onClick={() => toggleSection('sort')}
                    className="flex items-center justify-between w-full mb-2 group"
                >
                    <h3 className="text-xs font-bold text-black uppercase tracking-widest group-hover:text-brand-red transition-colors">Sort</h3>
                    {openSections.sort ? <Minus className="w-3 h-3 text-black" /> : <Plus className="w-3 h-3 text-black" />}
                </button>

                {openSections.sort && (
                    <div className="space-y-1.5">
                        {[
                            { label: 'Newest Arrivals', value: 'newest' },
                            { label: 'Name (A-Z)', value: 'name_asc' },
                            { label: 'Price (Low to High)', value: 'price_asc' },
                            { label: 'Price (High to Low)', value: 'price_desc' }
                        ].map((option) => (
                            <label key={option.value} className="flex items-center space-x-2 cursor-pointer group">
                                <input
                                    type="radio"
                                    name="sort"
                                    value={option.value}
                                    checked={createSortValue(filters.sort) === option.value}
                                    onChange={(e) => handleSortChange(e.target.value)}
                                    className="form-radio h-3 w-3 text-brand-red border-gray-300 focus:ring-brand-red"
                                />
                                <span className="text-xs font-bold uppercase tracking-widest text-gray-500 group-hover:text-black transition-colors">{option.label}</span>
                            </label>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function createSortValue(val?: string) {
    return val || 'newest';
}
