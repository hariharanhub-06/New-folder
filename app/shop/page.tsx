'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { getProductsPaginated, getCategories } from '@/lib/api';
import ShopProductList from '@/components/ShopProductList';
import { Product, ProductFilters, PaginatedResponse } from '@/lib/types';
import { useSearchParams } from 'next/navigation';

const ITEMS_PER_PAGE = 12;

function Shop() {
    const searchParams = useSearchParams();
    const [products, setProducts] = useState<Product[]>([]);
    const [offerProducts, setOfferProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<ProductFilters>({
        page: 1,
        limit: ITEMS_PER_PAGE,
        sort: 'newest'
    });
    const [pagination, setPagination] = useState<PaginatedResponse<Product>['pagination']>({
        total: 0,
        page: 1,
        limit: ITEMS_PER_PAGE,
        totalPages: 0
    });

    // Sync filters with URL search params
    useEffect(() => {
        const category = searchParams.get('category') || undefined;
        const sort = searchParams.get('sort') || 'newest';
        const isOffer = searchParams.get('isOffer') === 'true' ? true : undefined;
        const isTrending = searchParams.get('isTrending') === 'true' ? true : undefined;
        const isNewArrival = searchParams.get('isNewArrival') === 'true' ? true : undefined;
        const search = searchParams.get('search') || undefined;

        setFilters(prev => ({
            ...prev,
            category,
            sort: sort as any,
            isOffer,
            isTrending,
            isNewArrival,
            search,
            page: 1 // Reset to page 1 on param change
        }));
    }, [searchParams]);

    // Load initial categories
    useEffect(() => {
        getCategories().then(setCategories).catch(console.error);
    }, []);

    // Load products whenever filters change
    useEffect(() => {
        async function loadProducts() {
            setLoading(true);
            try {
                // Fetch Regular Products (allows isOffer to show in grid if checked) AND Offer Drops (isTrending: true)
                const queryFilters = {
                    ...filters,
                    limit: 2000
                };

                // Regular products fetch: We do NOT exclude offers anymore, so checked "Hot Offer" items appear here.
                // We might want to respect the 'isOffer' filter if the user explicitly set it in the URL, which 'filters' already has.
                // But for the initial load, we want everything.
                // Wait, 'filters' comes from URL. If URL has no filters, we just want everything.

                const [regularRes, offerRes] = await Promise.all([
                    getProductsPaginated({ ...queryFilters, isTrending: false }), // Exclude drops from grid? User said "should not be in the offer drop" for checkbox.
                    // But for Star (Trending), "available in offer drops".
                    // Usually if it's in the special carousel, we might not want it in the grid, or we do?
                    // "If the check box is clicked that should be at the best offer column and should not be in the offer drop"
                    // implies distinction.
                    // Let's assume Drops are exclusive to the top carousel for now, or at least highlighted there.
                    // If I filter isTrending: false here, then Star items vanish from grid.
                    // If I leave it, they appear in both.
                    // Let's filter isTrending: false to keep them unique to the carousel if that's the standard pattern for "Drops".
                    getProductsPaginated({ ...queryFilters, isTrending: true })
                ]);

                console.log('Trending (Drops) products fetched:', offerRes.data.length);

                setProducts(regularRes.data);
                setOfferProducts(offerRes.data);
                setPagination(regularRes.pagination);
            } catch (error) {
                console.error('Failed to load products:', error);
            } finally {
                setLoading(false);
            }
        }
        loadProducts();
    }, [filters]);

    const handlePageChange = useCallback((page: number) => {
        setFilters(prev => ({ ...prev, page }));
    }, []);

    const handleFilterChange = useCallback((newFilters: ProductFilters) => {
        // When filters change (category/price/sort), likely want to reset to page 1, 
        // but the child component might have already set page: 1 in the newFilters object.
        setFilters(newFilters);
    }, []);

    return (
        <ShopProductList
            products={products}
            offerProducts={offerProducts}
            categories={categories}
            pagination={pagination}
            filters={filters}
            loading={loading}
            onPageChange={handlePageChange}
            onFilterChange={handleFilterChange}
        />
    );
}

export default function ShopPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading Shop...</div>}>
            <Shop />
        </Suspense>
    );
}
