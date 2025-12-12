'use client';

import { useEffect, useState } from 'react';
import { getProducts } from '@/lib/api';
import { Product } from '@/lib/types';

export default function AdminDashboard() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const productsData = await getProducts();
                setProducts(productsData);
            } catch (error) {
                console.error('Failed to load data:', error);
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

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-slate-500 text-sm font-medium uppercase">Total Products</h3>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{products.length}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-slate-500 text-sm font-medium uppercase">Active Products</h3>
                    <p className="text-3xl font-bold text-slate-900 mt-2">
                        {products.filter(p => p.isActive).length}
                    </p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-slate-500 text-sm font-medium uppercase">Total Orders</h3>
                    <p className="text-3xl font-bold text-slate-900 mt-2">0</p>
                </div>
            </div>
        </div>
    );
}
