'use client';

import { useEffect, useState } from 'react';
import { getProducts } from '@/lib/api';
import AdminProductList from '@/components/AdminProductList';
import { Product } from '@/lib/types';

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const [productsData, categoriesData] = await Promise.all([
                    import('@/lib/api').then(m => m.getProducts(true)),
                    import('@/lib/api').then(m => m.getCategories())
                ]);
                setProducts(productsData);
                setCategories(categoriesData);
            } catch (error) {
                console.error('Failed to load products:', error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return <AdminProductList initialProducts={products} categories={categories} />;
}
