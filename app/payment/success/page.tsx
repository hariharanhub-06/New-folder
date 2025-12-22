"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Download, Home } from 'lucide-react';
import Invoice from '@/components/Invoice';
import { Order } from '@/lib/types';

function PaymentSuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orderId) {
            router.push('/');
            return;
        }

        const fetchOrder = async () => {
            try {
                const res = await fetch(`/api/orders/${orderId}`);
                const data = await res.json();
                if (data.order) {
                    setOrder(data.order);
                }
            } catch (error) {
                console.error('Error fetching order:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderId, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-pulse text-slate-500">Loading order details...</div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
                <div className="text-red-500 mb-4">Order not found</div>
                <button
                    onClick={() => router.push('/')}
                    className="px-6 py-2 bg-slate-900 text-white rounded-lg"
                >
                    Return Home
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Success Message */}
                <div className="bg-white p-8 rounded-2xl shadow-sm text-center space-y-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">Payment Successful!</h1>
                    <p className="text-slate-500">
                        Transaction ID: <span className="font-mono font-medium text-slate-900">{order.transactionId || order.cashfreePaymentId}</span>
                    </p>
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800 text-left mt-4">
                        <p className="font-semibold mb-1">Important:</p>
                        <p>Your parcel will be packed after 2 days from the confirmation date.</p>
                        <p className="mt-1">Once the shipment is done, you will receive the courier order ID/tracking no for your reference on your <strong>WhatsApp number</strong>.</p>
                    </div>

                    <div className="flex justify-center gap-4 pt-4">
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-6 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium shadow-sm"
                        >
                            <Download className="w-4 h-4" />
                            Download Invoice
                        </button>
                        <button
                            onClick={() => router.push('/')}
                            className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                        >
                            <Home className="w-4 h-4" />
                            Continue Shopping
                        </button>
                    </div>
                </div>

                {/* Invoice Display */}
                <div className="bg-white shadow-lg rounded-xl overflow-hidden">
                    <Invoice order={order} />
                </div>
            </div>
        </div>
    );
}

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50">Loading...</div>}>
            <PaymentSuccessContent />
        </Suspense>
    );
}
