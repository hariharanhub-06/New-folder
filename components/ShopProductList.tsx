"use client";

import { Product, ProductFilters, PaginatedResponse } from '@/lib/types';
import ProductCard from '@/components/ProductCard';
import ShopFilterSort from '@/components/ShopFilterSort';
import ProductDetailModal from '@/components/ProductDetailModal';
import CategorySection from '@/components/CategorySection';
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

    // Always group products by category for the Netflix-style layout
    // Even when filtered, we show the matching products in their category rows
    const groupedProducts = categories.map(category => ({
        category,
        items: products.filter(p => p.category === category)
    })).filter(group => group.items.length > 0);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">Our Collection</h1>

            <ShopFilterSort
                availableCategories={categories}
                filters={filters}
                onFilterChange={onFilterChange}
            />

            {loading ? (
                <div className="space-y-12">
                    {/* Skeleton for category sections */}
                    <div className="space-y-4">
                        <div className="h-8 w-48 bg-slate-100 rounded animate-pulse"></div>
                        <div className="flex gap-4 overflow-hidden">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="min-w-[200px] h-[300px] bg-slate-100 rounded-xl animate-pulse"></div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : groupedProducts.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-slate-500">No products found. Try adjusting your filters!</p>
                </div>
            ) : (
                <div className="space-y-12">
                    {groupedProducts.map((group) => (
                        <CategorySection
                            key={group.category}
                            title={group.category}
                            products={group.items}
                        />
                    ))}
                </div>
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
