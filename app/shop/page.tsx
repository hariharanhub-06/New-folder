'use client';

import { useEffect, useState } from 'react';
import { getProducts } from '@/lib/api';
import ShopProductList from '@/components/ShopProductList';
import { Product } from '@/lib/types';

export default function ShopPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadProducts() {
            try {
                const allProducts = await getProducts();
                const activeProducts = allProducts.filter(p => p.isActive);
                setProducts(activeProducts);
            } catch (error) {
                console.error('Failed to load products:', error);
            } finally {
                setLoading(false);
            }
        }
        loadProducts();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return <ShopProductList initialProducts={products} />;
}
