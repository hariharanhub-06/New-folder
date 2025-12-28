
import { Product, Order } from '@/lib/types';
import { Package, ShoppingBag, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import db from '@/lib/db';
import DashboardDateFilter from '@/components/DashboardDateFilter';

export const dynamic = 'force-dynamic';

async function getDashboardData(startDate?: string, endDate?: string) {
    let query = 'SELECT * FROM orders WHERE 1=1';
    const params: any[] = [];

    if (startDate) {
        params.push(startDate);
        query += ` AND created_at >= $${params.length}`;
    }
    if (endDate) {
        // Add 23:59:59 to end date to include the entire day
        params.push(`${endDate} 23:59:59`);
        query += ` AND created_at <= $${params.length}`;
    }

    query += ' ORDER BY created_at DESC';

    const productsRes = await db.query('SELECT * FROM products');
    const ordersRes = await db.query(query, params);

    const allOrders = ordersRes.rows.map(row => ({
        ...row,
        totalAmount: parseFloat(row.total_amount),
        shippingCost: parseFloat(row.shipping_cost || '0'),
        customerName: row.customer_name
    }));

    // For Main Dashboard: Only count confirmed business metrics
    const businessOrders = allOrders.filter(o => o.status !== 'Pending Payment' && o.status !== 'Payment Failed');

    return {
        products: productsRes.rows.map(row => ({
            ...row,
            price: parseFloat(row.price),
            isActive: row.is_active,
            imageUrl: row.image_url,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        })),
        orders: allOrders,
        businessOrders
    };
}

export default async function AdminDashboard({
    searchParams
}: {
    searchParams: { startDate?: string; endDate?: string }
}) {
    const { startDate, endDate } = searchParams;
    const { products, orders, businessOrders } = await getDashboardData(startDate, endDate);
    const lowStockProducts = products.filter((p: any) => p.stock < 5);

    const stats = [
        {
            label: 'Total Sales',
            value: `₹${businessOrders.reduce((sum: number, o: any) => sum + o.totalAmount, 0).toFixed(2)}`,
            icon: ShoppingBag,
            color: 'text-blue-600',
            bg: 'bg-blue-100'
        },
        {
            label: 'Total Products',
            value: products.length,
            icon: Package,
            color: 'text-indigo-600',
            bg: 'bg-indigo-100'
        },
    ];

    const statusCounts = {
        'Payment Confirmed': 0,
        'Parcel Prepared': 0,
        'Couried': 0,
        'Delivered': 0,
        'Cancelled': 0
    };

    orders.forEach((o: any) => {
        // @ts-ignore
        if (statusCounts[o.status] !== undefined) {
            // @ts-ignore
            statusCounts[o.status]++;
        }
    });

    return (
        <div className="space-y-8 font-jost">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold text-black uppercase tracking-tighter italic">Dashboard</h1>
                <DashboardDateFilter />
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white p-8 border border-gray-100 flex items-center justify-between group hover:border-brand-red transition-colors">
                        <div>
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">{stat.label}</p>
                            <p className="text-4xl font-black text-black mt-1">{stat.value}</p>
                        </div>
                        <div className={`p-4 bg-gray-50 group-hover:bg-brand-red transition-colors`}>
                            <stat.icon className={`w-8 h-8 ${stat.color} group-hover:text-white transition-colors`} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Order Status Grid */}
            <div>
                <h2 className="text-lg font-bold text-slate-900 mb-4">Order Status Breakdown</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {Object.entries(statusCounts).map(([status, count]) => (
                        <div key={status} className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 text-center hover:shadow-md transition-shadow">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{status}</p>
                            <p className={`text-2xl font-bold ${status === 'Payment Confirmed' ? 'text-blue-600' :
                                status === 'Delivered' ? 'text-green-600' :
                                    status === 'Cancelled' ? 'text-red-500' :
                                        'text-slate-800'
                                }`}>
                                {count}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Orders */}
                <div className="lg:col-span-2 bg-white border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-sm font-bold text-black uppercase tracking-widest">Recent Orders</h2>
                        <Link href="/admin/orders" className="text-xs text-brand-red hover:underline font-bold uppercase tracking-widest">View All</Link>
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
                                {businessOrders.slice(0, 5).map((order: any) => (
                                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-slate-600">#{order.id.slice(0, 8)}</td>
                                        <td className="px-6 py-4 font-medium text-slate-900">{order.customerName}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.status === 'Payment Confirmed' ? 'bg-indigo-100 text-indigo-800' :
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
                <div className="bg-white border border-gray-100 overflow-hidden h-fit">
                    <div className="p-6 border-b border-gray-100 bg-brand-red">
                        <h2 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-widest">
                            <AlertTriangle className="w-4 h-4" />
                            Stock Alerts
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
                                        <Link href={`/admin/products/${product.id}/edit`} className="block text-xs text-brand-red font-bold hover:underline mt-1 uppercase tracking-widest">Refill Stock</Link>
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
