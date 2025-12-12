export const dynamic = 'force-dynamic';

import { getProducts, getOrders } from '@/lib/db-admin'; // We will create this helper or use inline db queries if simple
import { Product, Order } from '@/lib/types';
import { Package, ShoppingBag, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import db from '@/lib/db';

async function getDashboardData() {
    const productsRes = await db.query('SELECT * FROM products');
    const ordersRes = await db.query('SELECT * FROM orders ORDER BY created_at DESC');

    return {
        products: productsRes.rows.map(row => ({
            ...row,
            price: parseFloat(row.price),
            isActive: row.is_active
        })),
        orders: ordersRes.rows.map(row => ({
            ...row,
            totalAmount: parseFloat(row.total_amount),
            shippingCost: parseFloat(row.shipping_cost)
        }))
    };
}

export default async function AdminDashboard() {
    const { products, orders } = await getDashboardData();
    const lowStockProducts = products.filter((p: any) => p.stock < 5);
    const pendingOrders = orders.filter((o: any) => o.status === 'New Order');

    const stats = [
        { label: 'Total Sales', value: `₹${orders.reduce((sum: number, o: any) => sum + o.totalAmount, 0).toFixed(2)}`, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-100' },
        { label: 'Active Orders', value: pendingOrders.length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
        { label: 'Low Stock Items', value: lowStockProducts.length, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' },
        { label: 'Total Products', value: products.length, icon: Package, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    ];


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
