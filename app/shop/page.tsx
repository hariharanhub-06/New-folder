'use client';

import { useEffect, useState, useCallback } from 'react';
import { getProductsPaginated, getCategories } from '@/lib/api';
import ShopProductList from '@/components/ShopProductList';
import { Product, ProductFilters, PaginatedResponse } from '@/lib/types';

const ITEMS_PER_PAGE = 12;

export default function ShopPage() {
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

    // Load initial categories
    useEffect(() => {
        getCategories().then(setCategories).catch(console.error);
    }, []);

    // Load products whenever filters change
    useEffect(() => {
        async function loadProducts() {
            setLoading(true);
            try {
                // Fetch Regular Products (isOffer: false) AND Offer Products (isOffer: true)
                // Both respect current filters (category, price, search)
                const queryFilters = {
                    ...filters,
                    limit: 2000
                };

                const [regularRes, offerRes] = await Promise.all([
                    getProductsPaginated({ ...queryFilters, isOffer: false }),
                    getProductsPaginated({ ...queryFilters, isOffer: true })
                ]);

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
