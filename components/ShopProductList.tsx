"use client";

import { useState, useMemo, useCallback, useTransition, useEffect } from 'react';
import { Product } from '@/lib/types';
import ProductCard from '@/components/ProductCard';
import ShopFilterSort from '@/components/ShopFilterSort';
import ProductDetailModal from '@/components/ProductDetailModal';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ShopProductListProps {
    initialProducts: Product[];
}

const ITEMS_PER_PAGE = 20;

export default function ShopProductList({ initialProducts }: ShopProductListProps) {
    const [displayProducts, setDisplayProducts] = useState<Product[]>(initialProducts);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isPending, startTransition] = useTransition();

    // Sync state with props when initialProducts changes
    useEffect(() => {
        setDisplayProducts(initialProducts);
    }, [initialProducts]);

    // Extract unique categories
    const availableCategories = useMemo(
        () => Array.from(new Set(initialProducts.map(p => p.category || 'Uncategorized'))).sort(),
        [initialProducts]
    );

    // Pagination logic
    const totalPages = Math.ceil(displayProducts.length / ITEMS_PER_PAGE);
    const paginatedProducts = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return displayProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [displayProducts, currentPage]);

    // Group products by category
    const groupedProducts = useMemo(() => {
        return paginatedProducts.reduce((acc, product) => {
            const category = product.category || 'Uncategorized';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(product);
            return acc;
        }, {} as Record<string, Product[]>);
    }, [paginatedProducts]);

    const categories = useMemo(() => Object.keys(groupedProducts).sort(), [groupedProducts]);

    const handleFilterSort = useCallback((products: Product[]) => {
        startTransition(() => {
            setDisplayProducts(products);
            setCurrentPage(1); // Reset to first page
        });
    }, []);

    const handlePageChange = useCallback((page: number) => {
        startTransition(() => {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }, []);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">Our Collection</h1>

            <ShopFilterSort
                products={initialProducts}
                availableCategories={availableCategories}
                onFilterSort={handleFilterSort}
            />

            {displayProducts.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-slate-500">No products found. Try adjusting your filters!</p>
                </div>
            ) : (
                <>
                    <div className={`space-y-12 ${isPending ? 'opacity-50' : ''}`}>
                        {categories.map(category => (
                            <div key={category} className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-2xl font-bold text-slate-800">{category}</h2>
                                    <div className="h-px bg-slate-200 flex-1"></div>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                    {groupedProducts[category].map((product) => (
                                        <ProductCard
                                            key={product.id}
                                            product={product}
                                            onSelect={setSelectedProduct}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-12">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1 || isPending}
                                className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 7) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 4) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 3) {
                                        pageNum = totalPages - 6 + i;
                                    } else {
                                        pageNum = currentPage - 3 + i;
                                    }

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => handlePageChange(pageNum)}
                                            disabled={isPending}
                                            className={`px-4 py-2 rounded-lg font-medium transition-all ${currentPage === pageNum
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
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages || isPending}
                                className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    <p className="text-center text-sm text-slate-500 mt-4">
                        Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, displayProducts.length)} of {displayProducts.length} products
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
