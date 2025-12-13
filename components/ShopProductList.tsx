"use client";

import { Product, ProductFilters, PaginatedResponse } from '@/lib/types';
import ProductCard from '@/components/ProductCard';
import ShopFilterSort from '@/components/ShopFilterSort';
import ProductDetailModal from '@/components/ProductDetailModal';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface ShopProductListProps {
    products: Product[];
    categories: string[];
    pagination: PaginatedResponse<Product>['pagination'];
    filters: ProductFilters;
    loading: boolean;
    onPageChange: (page: number) => void;
    onFilterChange: (filters: ProductFilters) => void;
}

export default function ShopProductList({
    products,
    categories,
    pagination,
    filters,
    loading,
    onPageChange,
    onFilterChange
}: ShopProductListProps) {
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    const { page, totalPages, total, limit } = pagination;

    const handlePageChange = (newPage: number) => {
        onPageChange(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">Our Collection</h1>

            <ShopFilterSort
                availableCategories={categories}
                filters={filters}
                onFilterChange={onFilterChange}
            />

            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {Array.from({ length: limit }).map((_, i) => (
                        <div key={i} className="aspect-[3/4] bg-slate-100 rounded-xl animate-pulse"></div>
                    ))}
                </div>
            ) : products.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-slate-500">No products found. Try adjusting your filters!</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {products.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onSelect={setSelectedProduct}
                            />
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-12">
                            <button
                                onClick={() => handlePageChange(page - 1)}
                                disabled={page === 1 || loading}
                                className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 7) {
                                        pageNum = i + 1;
                                    } else if (page <= 4) {
                                        pageNum = i + 1;
                                    } else if (page >= totalPages - 3) {
                                        pageNum = totalPages - 6 + i;
                                    } else {
                                        pageNum = page - 3 + i;
                                    }

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => handlePageChange(pageNum)}
                                            disabled={loading}
                                            className={`px-4 py-2 rounded-lg font-medium transition-all ${page === pageNum
                                                ? 'bg-indigo-600 text-white shadow-md'
                                                : 'border border-slate-300 hover:bg-slate-50'
                                                } disabled:opacity-50`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => handlePageChange(page + 1)}
                                disabled={page === totalPages || loading}
                                className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    <p className="text-center text-sm text-slate-500 mt-4">
                        Showing {((page - 1) * limit) + 1}-{Math.min(page * limit, total)} of {total} products
                    </p>
                </>
            )}

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
