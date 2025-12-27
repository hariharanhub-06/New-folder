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

import ShopCategoryCircles from '@/components/ShopCategoryCircles';
import { getProduct } from '@/lib/api';

interface ShopProductListProps {
    products: Product[];
    offerProducts?: Product[];
    categories: any[]; // Full category objects now
    pagination: PaginatedResponse<Product>['pagination'];
    filters: ProductFilters;
    loading: boolean;
    onPageChange: (page: number) => void;
    onFilterChange: (filters: ProductFilters) => void;
    initialProductId?: string;
}

export default function ShopProductList({
    products,
    offerProducts = [],
    categories,
    pagination,
    filters,
    loading,
    onPageChange,
    onFilterChange,
    initialProductId
}: ShopProductListProps) {
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    // Handle initial product load from URL (e.g. share link)
    useEffect(() => {
        if (initialProductId) {
            const fetchSharedProduct = async () => {
                const product = await getProduct(initialProductId);
                if (product) {
                    setSelectedProduct(product);
                    window.history.pushState({ modalOpen: true }, '');
                }
            };
            fetchSharedProduct();
        }
    }, [initialProductId]);

    // Auto-scroll logic removed as Offer Drops section is removed

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

    const { page, totalPages, total, limit } = pagination;

    const handlePageChange = (newPage: number) => {
        onPageChange(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-jost">
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Filter */}
                <SidebarFilter
                    filters={filters}
                    onFilterChange={onFilterChange}
                />

                {/* Main Content */}
                <div className="flex-1 min-w-0">

                    {/* New Circular Category Navigation */}
                    <ShopCategoryCircles
                        categories={categories}
                        selectedCategory={filters.category}
                        onSelectCategory={(cat) => onFilterChange({ ...filters, tag: undefined, category: cat, page: 1 })}
                    />

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
