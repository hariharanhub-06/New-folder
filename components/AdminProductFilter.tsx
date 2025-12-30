"use client";

import { Product } from '@/lib/types';
import { useState, useEffect, useRef } from 'react';
import { Filter, SortAsc } from 'lucide-react';

interface FilterSortProps {
    products: Product[];
    availableCategories: string[];
    onFilterSort: (filtered: Product[], resetPage?: boolean) => void;
}

const VISIBILITY_TAGS = [
    { label: 'New Arrivals', value: 'new-arrivals' },
    { label: 'Trending Now', value: 'trending-now' },
    { label: 'Best Offers', value: 'best-offers' },
    { label: 'Formal Shirts', value: 'formal-shirts' },
    { label: 'Baggy Shirts', value: 'baggy-shirts' },
    { label: 'Premium Shirts', value: 'premium-shirts' },
    { label: 'Bottoms', value: 'bottoms' },
    { label: 'Trousers', value: 'trousers' },
    { label: 'Hoodies', value: 'hoodies' },
    { label: 'T-Shirts', value: 't-shirts' },
];

export default function AdminProductFilter({ products, availableCategories, onFilterSort }: FilterSortProps) {
    const [category, setCategory] = useState<string>("All");
    const [sortBy, setSortBy] = useState<string>("name");
    const [status, setStatus] = useState<string>("All");
    const [stockFilter, setStockFilter] = useState<string>("All");
    const [attributeFilter, setAttributeFilter] = useState<string>("All");
    const [visibilityFilter, setVisibilityFilter] = useState<string>("All");

    // Track mount state and previous products to prevent infinite loops/unwanted resets
    const isMounted = useRef(false);
    const prevProductsRef = useRef(products);

    // Apply filters whenever filter options change
    useEffect(() => {
        // Skip logic on strict initial mount
        if (!isMounted.current) {
            isMounted.current = true;
            return;
        }

        let filtered = [...products];

        // Filter by category
        if (category !== "All") {
            filtered = filtered.filter(p => p.category === category);
        }

        // Filter by Visibility Tag
        if (visibilityFilter !== "All") {
            filtered = filtered.filter(p => p.visibilityTags && p.visibilityTags.includes(visibilityFilter));
        }

        // Filter by status
        if (status === "Active") {
            filtered = filtered.filter(p => p.isActive === true);
        } else if (status === "Inactive") {
            filtered = filtered.filter(p => p.isActive === false);
        }

        // Filter by stock level
        if (stockFilter === "Low") {
            filtered = filtered.filter(p => p.stock < 10);
        } else if (stockFilter === "Out") {
            filtered = filtered.filter(p => p.stock === 0);
        } else if (stockFilter === "In Stock") {
            filtered = filtered.filter(p => p.stock > 0);
        }

        // Filter by Attribute
        if (attributeFilter === "Trending") {
            filtered = filtered.filter(p => p.isTrending === true);
        } else if (attributeFilter === "New Arrival") {
            filtered = filtered.filter(p => p.isNewArrival === true);
        } else if (attributeFilter === "Offer") {
            filtered = filtered.filter(p => p.isOffer === true);
        }

        // Sort
        if (sortBy === "name") {
            filtered.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortBy === "price-low") {
            filtered.sort((a, b) => a.price - b.price);
        } else if (sortBy === "price-high") {
            filtered.sort((a, b) => b.price - a.price);
        } else if (sortBy === "stock") {
            filtered.sort((a, b) => a.stock - b.stock);
        }

        // Check if the update was caused ONLY by products changing (data refresh)
        // If so, do NOT reset the page.
        const productsChanged = products !== prevProductsRef.current;
        prevProductsRef.current = products;

        onFilterSort(filtered, !productsChanged);
    }, [category, sortBy, status, stockFilter, attributeFilter, visibilityFilter, products, onFilterSort]);

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center">
                        <Filter className="w-4 h-4 mr-2" />
                        Navbar Visibility
                    </label>
                    <select
                        value={visibilityFilter}
                        onChange={(e) => setVisibilityFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="All">All Visibility</option>
                        {VISIBILITY_TAGS.map(tag => (
                            <option key={tag.value} value={tag.value}>{tag.label}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center">
                        <Filter className="w-4 h-4 mr-2" />
                        Status
                    </label>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="All">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center">
                        <Filter className="w-4 h-4 mr-2" />
                        Stock Level
                    </label>
                    <select
                        value={stockFilter}
                        onChange={(e) => setStockFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="All">All Levels</option>
                        <option value="In Stock">In Stock</option>
                        <option value="Low">Low Stock (&lt;10)</option>
                        <option value="Out">Out of Stock</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center">
                        <Filter className="w-4 h-4 mr-2" />
                        Attribute
                    </label>
                    <select
                        value={attributeFilter}
                        onChange={(e) => setAttributeFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-brand-red focus:border-brand-red"
                    >
                        <option value="All">All Products</option>
                        <option value="Trending">Trending</option>
                        <option value="New Arrival">New Arrivals</option>
                        <option value="Offer">Best Offers</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center">
                        <SortAsc className="w-4 h-4 mr-2" />
                        Sort By
                    </label>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-brand-red focus:border-brand-red"
                    >
                        <option value="name">Name (A-Z)</option>
                        <option value="price-low">Price (Low to High)</option>
                        <option value="price-high">Price (High to Low)</option>
                        <option value="stock">Stock Level</option>
                    </select>
                </div>
            </div>
        </div>
    );
}
