'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { getProductsPaginated, getFullCategories } from '@/lib/api';
import ShopProductList from '@/components/ShopProductList';
import { Product, ProductFilters, PaginatedResponse } from '@/lib/types';
import { useSearchParams } from 'next/navigation';

const ITEMS_PER_PAGE = 12;

function Shop() {
    const searchParams = useSearchParams();
    const [products, setProducts] = useState<Product[]>([]);
    const [offerProducts, setOfferProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<any[]>([]); // Full category objects
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
        const isOfferDrop = searchParams.get('isOfferDrop') === 'true' ? true : undefined;
        const isNewArrival = searchParams.get('isNewArrival') === 'true' ? true : undefined;
        const tag = searchParams.get('tag') || undefined;
        const search = searchParams.get('search') || undefined;

        setFilters(prev => ({
            ...prev,
            category,
            sort: sort as any,
            isOffer,
            isTrending,
            isNewArrival,
            tag,
            search,
            page: 1 // Reset to page 1 on param change
        }));
    }, [searchParams]);

    // Load initial categories
    useEffect(() => {
        getFullCategories().then(setCategories).catch(console.error);
    }, []);

    // Load products whenever filters change
    useEffect(() => {
        async function loadProducts() {
            setLoading(true);
            try {
                const queryFilters = {
                    ...filters,
                    limit: 2000
                };

                // Determine if we're viewing a filtered collection (Best Offers, New Arrivals, Trending)
                const isFilteredView = filters.isOffer !== undefined ||
                    filters.isNewArrival !== undefined ||
                    filters.isTrending !== undefined ||
                    filters.isOfferDrop !== undefined ||
                    filters.tag !== undefined;

                let regularRes, offerRes;

                if (isFilteredView) {
                    // User is filtering by a specific flag - only fetch those products
                    // Don't show Offer Drops carousel on filtered views
                    regularRes = await getProductsPaginated(queryFilters);
                    offerRes = { data: [], pagination: { total: 0, page: 1, limit: 0, totalPages: 0 } };
                } else {
                    // Default shop view: show all products EXCEPT offer drops in the grid
                    // AND fetch offer drop products separately for the Offer Drops carousel
                    [regularRes, offerRes] = await Promise.all([
                        getProductsPaginated({ ...queryFilters, isOfferDrop: false }),
                        getProductsPaginated({ ...queryFilters, isOfferDrop: true })
                    ]);
                }

                console.log('Regular products fetched:', regularRes.data.length);
                console.log('Offer Drop products fetched:', offerRes.data.length);

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
            initialProductId={searchParams.get('productId') || undefined}
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
