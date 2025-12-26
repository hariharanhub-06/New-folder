'use client';

import { useEffect, useState, useCallback } from 'react';
import { getProductsPaginated, getCategories } from '@/lib/api';
import ShopProductList from '@/components/ShopProductList';
import { Product, ProductFilters, PaginatedResponse } from '@/lib/types';

const ITEMS_PER_PAGE = 12;

export default function ShopPage() {
    const [products, setProducts] = useState<Product[]>([]);
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
                // Determine if we are in "Search/Filter Mode" or "Browse Mode"
                const isFiltered = filters.search || filters.category || filters.minPrice || filters.maxPrice || filters.sort !== 'newest' || filters.includeInactive;

                // If browsing (no filters), fetch ALL products (high limit) for the category rows
                // If filtering, use standard pagination
                const queryFilters = {
                    ...filters,
                    limit: isFiltered ? ITEMS_PER_PAGE : 2000 // High limit to get all for categories
                };

                const response = await getProductsPaginated(queryFilters);
                setProducts(response.data);
                setPagination(response.pagination);
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
            categories={categories}
            pagination={pagination}
            filters={filters}
            loading={loading}
            onPageChange={handlePageChange}
            onFilterChange={handleFilterChange}
        />
    );
}
