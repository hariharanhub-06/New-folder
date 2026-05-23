"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Package, ArrowLeft } from 'lucide-react';
import OrderStatusStepper from '@/components/OrderStatusStepper';
import { Order } from '@/lib/types';
import { optimizeImageUrl } from '@/lib/imagekit';

export default function CustomerOrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/customer/orders')
            .then(r => {
                if (r.status === 401) { router.push('/login?next=/account/orders'); return null; }
                return r.json();
            })
            .then(data => {
                if (data?.orders) setOrders(data.orders);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <Link href="/account" className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold uppercase tracking-[0.3em]">My Orders</h1>
                </div>

                {orders.length === 0 ? (
                    <div className="text-center py-20">
                        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h2 className="text-lg font-bold text-gray-500 mb-2">No orders yet</h2>
                        <p className="text-sm text-gray-400 mb-6">Your order history will appear here</p>
                        <Link href="/shop" className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold text-sm hover:bg-indigo-700 transition-colors">
                            Start Shopping
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map(order => (
                            <div key={order.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Order</p>
                                        <p className="font-bold text-gray-900">#{order.id.slice(0, 8).toUpperCase()}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {new Date(order.createdAt!).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total</p>
                                        <p className="font-bold text-gray-900">₹{order.totalAmount.toFixed(2)}</p>
                                    </div>
                                </div>

                                {/* Items */}
                                <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                                    {(order.items || []).slice(0, 4).map((item: any) => (
                                        <div key={item.id} className="flex-shrink-0 relative w-14 h-14 rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
                                            {item.imageUrl ? (
                                                <Image
                                                    src={optimizeImageUrl(item.imageUrl, { width: 56, height: 56 })}
                                                    alt={item.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Package className="w-5 h-5 text-gray-300" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {(order.items?.length || 0) > 4 && (
                                        <div className="flex-shrink-0 w-14 h-14 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-400">
                                            +{order.items!.length - 4}
                                        </div>
                                    )}
                                </div>

                                {/* Status Stepper */}
                                <OrderStatusStepper status={order.status} />

                                {/* Shipping info when couried/delivered */}
                                {(order.status === 'Couried' || order.status === 'Delivered') && (order.logisticsId || order.courierName) && (
                                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm">
                                        {order.courierName && <p className="text-gray-700">Courier: <strong>{order.courierName}</strong></p>}
                                        {order.logisticsId && <p className="text-gray-700">Tracking ID: <strong>{order.logisticsId}</strong></p>}
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
