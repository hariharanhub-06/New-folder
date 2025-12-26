"use client";

import { Product, ProductFilters, PaginatedResponse } from '@/lib/types';
import ProductCard from '@/components/ProductCard';
import ProductDetailModal from '@/components/ProductDetailModal';
import SidebarFilter from '@/components/SidebarFilter';
import { ChevronLeft, ChevronRight, Star, Sparkles, Shirt, Scissors, Briefcase, Tag, LayoutGrid, Watch, Glasses, Flame } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { UnifrakturMaguntia } from 'next/font/google';

const gothic = UnifrakturMaguntia({
    weight: "400",
    subsets: ["latin"],
});

interface ShopProductListProps {
    products: Product[];
    offerProducts?: Product[];
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

    const [isAutoScrolling, setIsAutoScrolling] = useState(true);
    const scrollPauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Handle manual scroll/interaction to pause auto-scroll
    const handleUserInteraction = () => {
        setIsAutoScrolling(false);

        // Clear any existing resume timeout
        if (scrollPauseTimeoutRef.current) {
            clearTimeout(scrollPauseTimeoutRef.current);
        }

        // Set a new timeout to resume auto-scroll after 6 seconds of inactivity
        scrollPauseTimeoutRef.current = setTimeout(() => {
            setIsAutoScrolling(true);
        }, 6000);
    };

    // Handle browser back button for modal
    useEffect(() => {
        const handlePopState = () => {
            if (selectedProduct) {
                setSelectedProduct(null);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [selectedProduct]);

    const handleProductSelect = (product: Product) => {
        setSelectedProduct(product);
        // Push a state so back button closes the modal
        window.history.pushState({ modalOpen: true }, '');
    };

    const handleModalClose = () => {
        setSelectedProduct(null);
        // If we opened a modal and pushed state, go back to clean it up
        if (window.history.state?.modalOpen) {
            window.history.back();
        }
    };

    // Auto-scroll offers every 1 second
    useEffect(() => {
        if (!offerProducts.length || !offerScrollRef.current || !isAutoScrolling) return;

        const scrollInterval = setInterval(() => {
            if (offerScrollRef.current) {
                const scrollAmount = 165; // Card width (150) + gap (15)
                offerScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });

                // Reset to start if we've reached the end
                const { scrollLeft, scrollWidth, clientWidth } = offerScrollRef.current;
                if (scrollLeft + clientWidth >= scrollWidth - 10) {
                    setTimeout(() => {
                        offerScrollRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
                    }, 1000);
                }
            }
        }, 1000);

        return () => clearInterval(scrollInterval);
    }, [offerProducts.length, isAutoScrolling]);

    const { page, totalPages, total, limit } = pagination;

    const handlePageChange = (newPage: number) => {
        onPageChange(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Helper to get icon for category
    const getCategoryIcon = (category: string) => {
        const lower = category.toLowerCase();
        if (lower.includes('shirt')) return <Shirt className="w-4 h-4" />;
        if (lower.includes('pant') || lower.includes('bottom') || lower.includes('trouser')) return <Scissors className="w-4 h-4" />;
        if (lower.includes('formal') || lower.includes('suit')) return <Briefcase className="w-4 h-4" />;
        if (lower.includes('watch')) return <Watch className="w-4 h-4" />;
        if (lower.includes('glass')) return <Glasses className="w-4 h-4" />;
        return <Tag className="w-4 h-4" />;
    };

    // Horizontal scroll grid: consistent card sizing for standard look
    const getOfferGridLayout = () => {
        const count = offerProducts.length;
        if (count === 0) return null;

        return (
            <div className={`grid grid-rows-1 grid-flow-col auto-cols-[160px] md:auto-cols-[180px] gap-3 pb-2`}>
                {offerProducts.map((product) => (
                    <div key={product.id} className="h-full">
                        <ProductCard product={product} onSelect={handleProductSelect} />
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-jost">
            {/* Removed 'Street Drops' heading as requested */}

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Filter */}
                <SidebarFilter
                    filters={filters}
                    onFilterChange={onFilterChange}
                />

                {/* Main Content */}
                <div className="flex-1 min-w-0">

                    {/* Offer Section - "STREET HEAT" Style */}
                    {!loading && offerProducts.length > 0 && (
                        <div className="mb-10 relative overflow-hidden bg-black p-4 md:p-6 border-l-4 border-brand-red shadow-2xl">
                            {/* Background Texture Overlay */}
                            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-brand-red text-white">
                                            <Flame className="w-5 h-5 fill-current" />
                                        </div>
                                        <div className="flex flex-col leading-none">
                                            <span className={`${gothic.className} text-brand-red text-xl`}>Exclusive</span>
                                            <h2 className="text-sm font-black text-white uppercase tracking-[0.3em]">
                                                Offer Drops <span className="text-brand-red ml-1">{offerProducts.length > 0 && `(${offerProducts.length})`}</span>
                                            </h2>
                                        </div>
                                    </div>
                                    <div className="hidden sm:block">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest border border-gray-800 px-3 py-1">Limited Time Only</span>
                                    </div>
                                </div>

                                {/* Horizontal Scroll */}
                                <div
                                    ref={offerScrollRef}
                                    onWheel={handleUserInteraction}
                                    onTouchStart={handleUserInteraction}
                                    onPointerDown={handleUserInteraction}
                                    className="overflow-x-auto overflow-y-hidden scrollbar-hide -mx-2 px-2 pb-2"
                                    style={{
                                        overscrollBehaviorX: 'contain',
                                        WebkitOverflowScrolling: 'touch'
                                    }}
                                >
                                    {getOfferGridLayout()}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Category Tabs - Streetsyle styling */}
                    <div className="mb-10 overflow-x-auto scrollbar-hide">
                        <div className="flex gap-2">
                            <button
                                onClick={() => onFilterChange({ ...filters, category: undefined, page: 1 })}
                                className={`flex items-center px-6 py-3 text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap border ${!filters.category
                                    ? 'bg-black text-white border-black shadow-lg shadow-black/10'
                                    : 'bg-white text-gray-400 border-gray-100 hover:text-black hover:border-black'
                                    }`}
                            >
                                <LayoutGrid className="w-4 h-4 mr-2" />
                                All Drops
                            </button>
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => onFilterChange({ ...filters, category: cat, page: 1 })}
                                    className={`flex items-center px-6 py-3 text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap border ${filters.category === cat
                                        ? 'bg-black text-white border-black shadow-lg shadow-black/10'
                                        : 'bg-white text-gray-400 border-gray-100 hover:text-black hover:border-black'
                                        }`}
                                >
                                    <span className="mr-2">{getCategoryIcon(cat)}</span>
                                    {cat}s
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Product Grid */}
                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-6">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="min-w-full h-[300px] bg-slate-100 rounded-xl animate-pulse"></div>
                            ))}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-20 bg-gray-50 border-2 border-dashed border-gray-200">
                            <Flame className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No heat found in this category.</p>
                            <button
                                onClick={() => onFilterChange({ ...filters, category: undefined, minPrice: undefined, maxPrice: undefined })}
                                className="mt-6 px-8 py-3 bg-black text-white text-[10px] font-bold uppercase tracking-widest hover:bg-brand-red transition-all"
                            >
                                Clear all filters
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-6">
                            {products.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onSelect={handleProductSelect}
                                />
                            ))}
                        </div>
                    )}

                    {/* Pagination (if needed) */}
                    {totalPages > 1 && (
                        <div className="mt-8 flex justify-center">
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
                    onClose={handleModalClose}
                />
            )}
        </div>
    );
}
