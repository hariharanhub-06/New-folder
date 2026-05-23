"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { Customer, Order } from '@/lib/types';
import OrderStatusStepper from '@/components/OrderStatusStepper';

export default function AdminCustomerDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/admin/customers/${id}`)
            .then(r => {
                if (!r.ok) { router.push('/admin/customers'); return null; }
                return r.json();
            })
            .then(data => {
                if (data) {
                    setCustomer(data.customer);
                    setOrders(data.orders);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
            </div>
        );
    }

    if (!customer) return null;

    const totalSpent = orders.reduce((a, o) => a + o.totalAmount, 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/admin/customers" className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-xl font-bold text-white uppercase tracking-[0.3em]">Customer Profile</h1>
            </div>

            {/* Customer Info Card */}
            <div className="bg-black border border-gray-800 rounded-xl p-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-indigo-900/50 rounded-full flex items-center justify-center">
                        <User className="w-7 h-7 text-indigo-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-white">{customer.name}</h2>
                            {customer.isVerified
                                ? <CheckCircle className="w-4 h-4 text-green-500" />
                                : <XCircle className="w-4 h-4 text-gray-600" />
                            }
                        </div>
                        <p className="text-sm text-gray-400">
                            Member since {new Date(customer.createdAt!).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-gray-900 rounded-xl p-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Mobile</p>
                        <p className="text-sm font-semibold text-white">{customer.mobile}</p>
                    </div>
                    <div className="bg-gray-900 rounded-xl p-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Email</p>
                        <p className="text-sm font-semibold text-white truncate">{customer.email}</p>
                    </div>
                    <div className="bg-gray-900 rounded-xl p-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Total Spent</p>
                        <p className="text-sm font-semibold text-white">₹{totalSpent.toLocaleString('en-IN')}</p>
                    </div>
                </div>
            </div>

            {/* Order History */}
            <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">
                    Order History ({orders.length})
                </h3>

                {orders.length === 0 ? (
                    <div className="bg-black border border-gray-800 rounded-xl p-8 text-center">
                        <p className="text-gray-500">No orders placed yet</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {orders.map(order => (
                            <div key={order.id} className="bg-black border border-gray-800 rounded-xl p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-white text-sm">#{order.id.slice(0, 8).toUpperCase()}</p>
                                            <Link
                                                href={`/admin/orders`}
                                                className="text-gray-600 hover:text-indigo-400 transition-colors"
                                                title="View in Orders"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </Link>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {new Date(order.createdAt!).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-white">₹{order.totalAmount.toFixed(2)}</p>
                                        <p className="text-xs text-gray-500">{order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}</p>
                                    </div>
                                </div>

                                <OrderStatusStepper status={order.status} />

                                {(order.status === 'Couried' || order.status === 'Delivered') && (order.logisticsId || order.courierName) && (
                                    <div className="mt-3 p-3 bg-amber-900/20 border border-amber-900/50 rounded-lg text-xs">
                                        {order.courierName && <span className="text-amber-400">Courier: <strong>{order.courierName}</strong></span>}
                                        {order.courierName && order.logisticsId && <span className="text-gray-600 mx-2">·</span>}
                                        {order.logisticsId && <span className="text-amber-400">Tracking: <strong>{order.logisticsId}</strong></span>}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
