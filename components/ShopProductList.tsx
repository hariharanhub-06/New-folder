"use client";

import { Product, ProductFilters, PaginatedResponse } from '@/lib/types';
import ProductCard from '@/components/ProductCard';
import ProductDetailModal from '@/components/ProductDetailModal';
import SidebarFilter from '@/components/SidebarFilter';
import { ChevronLeft, ChevronRight, Star, Sparkles, Shirt, Scissors, Briefcase, Tag, LayoutGrid, Watch, Glasses } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface ShopProductListProps {
    products: Product[];
    offerProducts?: Product[]; // New prop
    categories: string[];
    pagination: PaginatedResponse<Product>['pagination'];
    filters: ProductFilters;
    loading: boolean;
    onPageChange: (page: number) => void;
    onFilterChange: (filters: ProductFilters) => void;
}

export default function ShopProductList({
    products,
    offerProducts = [],
    categories,
    pagination,
    filters,
    loading,
    onPageChange,
    onFilterChange
}: ShopProductListProps) {
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const offerScrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll offers every 2 seconds
    useEffect(() => {
        if (!offerProducts.length || !offerScrollRef.current) return;

        const scrollInterval = setInterval(() => {
            if (offerScrollRef.current) {
                const scrollAmount = 220; // Card width (200) + gap (20)
                offerScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });

                // Reset to start if we've reached the end
                const { scrollLeft, scrollWidth, clientWidth } = offerScrollRef.current;
                if (scrollLeft + clientWidth >= scrollWidth - 10) {
                    setTimeout(() => {
                        offerScrollRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
                    }, 2000);
                }
            }
        }, 2000);

        return () => clearInterval(scrollInterval);
    }, [offerProducts.length]);

    const { page, totalPages, total, limit } = pagination;

    const handlePageChange = (newPage: number) => {
        onPageChange(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Helper to get icon for category
    const getCategoryIcon = (category: string) => {
        const lower = category.toLowerCase();
        if (lower.includes('shirt')) return <Shirt className="w-4 h-4" />;
        if (lower.includes('pant') || lower.includes('bottom') || lower.includes('trouser')) return <Scissors className="w-4 h-4" />; // Scissors as abstraction for tailoring/pants
        if (lower.includes('formal') || lower.includes('suit')) return <Briefcase className="w-4 h-4" />;
        if (lower.includes('watch')) return <Watch className="w-4 h-4" />;
        if (lower.includes('glass')) return <Glasses className="w-4 h-4" />;
        return <Tag className="w-4 h-4" />;
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Our Collection</h1>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Filter */}
                <SidebarFilter
                    filters={filters}
                    onFilterChange={onFilterChange}
                />

                {/* Main Content */}
                <div className="flex-1">

                    {/* Offer Section - Always visible at top of main content */}
                    {!loading && offerProducts.length > 0 && (
                        <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-600 via-red-600 to-pink-600 p-6 shadow-2xl">
                            {/* Animated Background Pattern */}
                            <div className="absolute inset-0 opacity-20">
                                <div className="absolute inset-0" style={{
                                    backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%),
                                                     radial-gradient(circle at 80% 80%, rgba(255,255,255,0.2) 0%, transparent 50%),
                                                     radial-gradient(circle at 40% 20%, rgba(255,255,255,0.15) 0%, transparent 50%)`
                                }}></div>
                            </div>

                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                                        <Sparkles className="w-6 h-6 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white tracking-tight drop-shadow-lg">
                                        Exclusive Offers
                                    </h2>
                                </div>

                                {/* 2-Row Horizontal Scroll Grid */}
                                <div
                                    ref={offerScrollRef}
                                    className="overflow-x-auto overflow-y-hidden scrollbar-hide -mx-2 px-2"
                                    style={{ overscrollBehaviorX: 'contain' }}
                                >
                                    <div className="grid grid-rows-2 grid-flow-col gap-4 w-max pb-2">
                                        {offerProducts.map((product) => (
                                            <div key={product.id} className="w-[200px] bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                                                <ProductCard
                                                    product={product}
                                                    onSelect={setSelectedProduct}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Category Tabs */}
                    <div className="mb-8 overflow-x-auto pb-2 scrollbar-hide">
                        <div className="flex space-x-2">
                            <button
                                onClick={() => onFilterChange({ ...filters, category: undefined, page: 1 })}
                                className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${!filters.category
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                                    }`}
                            >
                                <LayoutGrid className="w-4 h-4 mr-2" />
                                All Products
                            </button>
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => onFilterChange({ ...filters, category: cat, page: 1 })}
                                    className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${filters.category === cat
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                                        }`}
                                >
                                    <span className="mr-2">{getCategoryIcon(cat)}</span>
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Product Grid */}
                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="min-w-full h-[300px] bg-slate-100 rounded-xl animate-pulse"></div>
                            ))}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                            <Scissors className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 font-medium">No products found in this category.</p>
                            <button
                                onClick={() => onFilterChange({ ...filters, category: undefined, minPrice: undefined, maxPrice: undefined })}
                                className="mt-4 text-indigo-600 font-medium hover:underline"
                            >
                                Clear all filters
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 gap-6">
                            {products.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onSelect={setSelectedProduct}
                                />
                            ))}
                        </div>
                    )}

                    {/* Pagination (if needed) */}
                    {totalPages > 1 && (
                        <div className="mt-8 flex justify-center">
                            {/* ... simple pagination controls matching previous style but centered ... */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handlePageChange(page - 1)}
                                    disabled={page === 1}
                                    className="p-2 border rounded-full hover:bg-slate-100 disabled:opacity-50"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="px-4 py-2 text-sm font-medium text-slate-600">
                                    Page {page} of {totalPages}
                                </span>
                                <button
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={page === totalPages}
                                    className="p-2 border rounded-full hover:bg-slate-100 disabled:opacity-50"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Product Detail Modal */}
            {selectedProduct && (
                <ProductDetailModal
                    product={selectedProduct}
                    onClose={() => setSelectedProduct(null)}
                />
            )}
        </div>
    );
}
