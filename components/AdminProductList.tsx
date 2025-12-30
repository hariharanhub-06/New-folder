"use client";

import Link from 'next/link';
import { Plus, ChevronLeft, ChevronRight, Pencil, X } from 'lucide-react';
import { Product } from '@/lib/types';
import DeleteProductButton from '@/components/DeleteProductButton';
import ToggleStatusButton from '@/components/ToggleStatusButton';
import ToggleOfferDropButton from '@/components/ToggleOfferDropButton';
import AdminProductFilter from '@/components/AdminProductFilter';
import { useState, useMemo, useTransition, useCallback, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import AddProductForm from './AddProductForm';
import EditProductForm from './EditProductForm';

interface AdminProductListProps {
    initialProducts: Product[];
    categories?: string[];
}

const ITEMS_PER_PAGE = 25;

export default function AdminProductList({ initialProducts, categories }: AdminProductListProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const [displayProducts, setDisplayProducts] = useState<Product[]>(initialProducts);
    const currentPage = Number(searchParams.get('page')) || 1;
    const [isPending, startTransition] = useTransition();

    // Modal States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Sync products if prop changes (e.g. after refresh/edit)
    useEffect(() => {
        // When initialProducts changes (due to router.refresh()), we must update displayProducts
        setDisplayProducts(initialProducts);
        // Also ensure editingProduct is closed if it refers to a stale object, though we handle that in handleSuccess
    }, [initialProducts]);

    const handleSuccess = useCallback(() => {
        setIsAddModalOpen(false);
        setEditingProduct(null);
        router.refresh();
    }, [router]);

    // ... availableCategories calculation remains same ...
    const availableCategories = useMemo(
        () => {
            if (categories && categories.length > 0) return categories;
            return Array.from(new Set(initialProducts.map(p => p.category || 'Uncategorized'))).sort();
        },
        [initialProducts, categories]
    );

    // Pagination
    const totalPages = Math.ceil(displayProducts.length / ITEMS_PER_PAGE);
    const paginatedProducts = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return displayProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [displayProducts, currentPage]);

    const handleFilterSort = useCallback((products: Product[], resetPage: boolean = true) => {
        startTransition(() => {
            setDisplayProducts(products);
            if (resetPage) {
                const params = new URLSearchParams(searchParams);
                params.set('page', '1');
                router.push(`${pathname}?${params.toString()}`, { scroll: false });
            }
        });
    }, [router, pathname, searchParams]);

    const handlePageChange = useCallback((page: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', page.toString());
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }, [router, pathname, searchParams]);

    return (
        <div className="space-y-6 font-jost">
            <div className="flex justify-between items-center px-2">
                <h1 className="text-3xl font-bold text-black uppercase tracking-tighter italic">Products</h1>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center px-6 py-2.5 border border-transparent shadow-sm text-xs font-bold uppercase tracking-widest text-white bg-black hover:bg-brand-red focus:outline-none active:scale-95 transition-all"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Product
                </button>
            </div>

            <AdminProductFilter
                products={initialProducts}
                availableCategories={availableCategories}
                onFilterSort={handleFilterSort}
            />

            <div className={`bg-white border border-gray-100 overflow-hidden ${isPending ? 'opacity-50' : ''}`}>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Price</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Stock</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {paginatedProducts.map((product) => (
                                <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-slate-900">{product.name}</div>
                                        <div className="text-sm text-slate-500">{product.category}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        ₹{product.price.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        <div className="font-medium">{product.stock}</div>
                                        {product.sizes && product.sizes.length > 0 && (
                                            <div className="text-xs text-slate-400 max-w-[150px] truncate" title={product.sizes.map(s => `${s.size}: ${s.stock}`).join(', ')}>
                                                {product.sizes.map(s => `${s.size}:${s.stock}`).join(', ')}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.isActive
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-slate-100 text-slate-800'
                                            }`}>
                                            {product.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                        <div className="inline-block flex-shrink-0 ml-2 align-middle">
                                            <ToggleOfferDropButton
                                                productId={product.id}
                                                currentStatus={product.isOfferDrop || false}
                                            />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end space-x-2">
                                        <button
                                            onClick={() => setEditingProduct(product)}
                                            className="text-gray-400 hover:text-brand-red p-2 hover:bg-gray-50 rounded-full transition-all active:scale-90"
                                            title="Edit Product"
                                        >
                                            <Pencil className="w-4.5 h-4.5" />
                                        </button>
                                        <ToggleStatusButton
                                            id={product.id}
                                            isActive={product.isActive}
                                            onToggle={() => {
                                                setDisplayProducts(current =>
                                                    current.map(p =>
                                                        p.id === product.id ? { ...p, isActive: !p.isActive } : p
                                                    )
                                                );
                                            }}
                                        />
                                        <DeleteProductButton
                                            id={product.id}
                                            onDelete={() => {
                                                setDisplayProducts(current => current.filter(p => p.id !== product.id));
                                            }}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
                        <div className="text-sm text-slate-500">
                            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, displayProducts.length)} of {displayProducts.length} products
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1 || isPending}
                                className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-white hover:border-slate-400 hover:text-indigo-600 bg-white shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                                title="Previous Page"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => handlePageChange(pageNum)}
                                            disabled={isPending}
                                            className={`px-3 py-1 rounded-none font-bold text-xs transition-all ${currentPage === pageNum
                                                ? 'bg-brand-red text-white shadow-md'
                                                : 'border border-gray-200 text-gray-500 hover:bg-gray-50'
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
                                className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-white hover:border-slate-400 hover:text-indigo-600 bg-white shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                                title="Next Page"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {(isAddModalOpen || editingProduct) && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                        onClick={() => {
                            setIsAddModalOpen(false);
                            setEditingProduct(null);
                        }}
                    />

                    {/* Modal Content */}
                    <div className="relative bg-white w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col rounded-2xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center px-8 py-6 border-b border-gray-100 flex-shrink-0 bg-white/80 backdrop-blur-md z-10 sticky top-0">
                            <div>
                                <h2 className="text-2xl font-black text-black uppercase tracking-tighter italic">
                                    {isAddModalOpen ? 'Create New Product' : `Edit Product`}
                                </h2>
                                {!isAddModalOpen && editingProduct && (
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-1">
                                        Ref: {editingProduct.name}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => {
                                    setIsAddModalOpen(false);
                                    setEditingProduct(null);
                                }}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors group"
                            >
                                <X className="w-6 h-6 text-slate-400 group-hover:text-black transition-colors" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            {isAddModalOpen && (
                                <AddProductForm
                                    onSuccess={handleSuccess}
                                    onCancel={() => setIsAddModalOpen(false)}
                                />
                            )}
                            {editingProduct && (
                                <EditProductForm
                                    product={editingProduct}
                                    onSuccess={handleSuccess}
                                    initialPage={currentPage.toString()}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
