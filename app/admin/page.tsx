
import { Product, Order } from '@/lib/types';
import { Package, ShoppingBag, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

async function getDashboardData() {
    const productsRes = await db.query('SELECT * FROM products');
    const ordersRes = await db.query('SELECT * FROM orders ORDER BY created_at DESC');

    return {
        products: productsRes.rows.map(row => ({
            ...row,
            price: parseFloat(row.price),
            isActive: row.is_active,
            imageUrl: row.image_url, // Ensure field mapping matches types
            createdAt: row.created_at,
            updatedAt: row.updated_at
        })),
        orders: ordersRes.rows.map(row => ({
            ...row,
            totalAmount: parseFloat(row.total_amount),
            shippingCost: parseFloat(row.shipping_cost),
            customerName: row.customer_name
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

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-slate-900">Dashboard Overview</h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
                            <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                        </div>
                        <div className={`p-3 rounded-lg ${stat.bg}`}>
                            <stat.icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Orders */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-slate-900">Recent Orders</h2>
                        <Link href="/admin/orders" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">View All</Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4">Order ID</th>
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {orders.slice(0, 5).map((order: any) => (
                                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-slate-600">#{order.id.slice(0, 8)}</td>
                                        <td className="px-6 py-4 font-medium text-slate-900">{order.customerName}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.status === 'New Order' ? 'bg-amber-100 text-amber-800' :
                                                    order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                                                        order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                                                            'bg-gray-100 text-gray-800'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-slate-900">₹{order.totalAmount.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Low Stock Alerts */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden h-fit">
                    <div className="p-6 border-b border-slate-100">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                            Low Stock Alerts
                        </h2>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                        {lowStockProducts.length === 0 ? (
                            <div className="p-6 text-center text-slate-500">All products are well stocked!</div>
                        ) : (
                            lowStockProducts.map((product: any) => (
                                <div key={product.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={product.imageUrl || product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900 text-sm line-clamp-1">{product.name}</p>
                                            <p className="text-xs text-slate-500">ID: {product.id.slice(0, 8)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-red-600 font-bold text-sm">{product.stock} left</span>
                                        <Link href={`/admin/products?edit=${product.id}`} className="block text-xs text-indigo-600 hover:text-indigo-700 mt-1">Refill</Link>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
