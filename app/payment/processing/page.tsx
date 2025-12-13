"use client";

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Timer, AlertCircle } from 'lucide-react';

function PaymentProcessingContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');
    const [timeLeft, setTimeLeft] = useState(180); // 3 minutes in seconds
    const [status, setStatus] = useState('processing');

    const handleTimeout = useCallback(() => {
        router.push(`/payment/failed?orderId=${orderId}&reason=timeout`);
    }, [router, orderId]);

    const checkPaymentStatus = useCallback(async () => {
        try {
            const res = await fetch(`/api/payment/status/${orderId}`);
            const data = await res.json();

            if (data.status === 'paid') {
                router.push(`/payment/success?orderId=${orderId}`);
            } else if (data.status === 'failed') {
                router.push(`/payment/failed?orderId=${orderId}&reason=failed`);
            }
        } catch (error) {
            console.error('Error checking payment status:', error);
        }
    }, [router, orderId]);

    useEffect(() => {
        if (!orderId) {
            router.push('/');
            return;
        }

        // Countdown timer
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleTimeout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Poll payment status
        const pollInterval = setInterval(checkPaymentStatus, 5000);

        return () => {
            clearInterval(timer);
            clearInterval(pollInterval);
        };
    }, [orderId, router, checkPaymentStatus, handleTimeout]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-6">
                <div className="relative w-20 h-20 mx-auto">
                    <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                    <Loader2 className="absolute inset-0 m-auto w-8 h-8 text-blue-600 animate-pulse" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-slate-900">Processing Payment</h1>
                    <p className="text-slate-500">Please complete the payment in your UPI app</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl flex items-center justify-center gap-3 text-blue-700">
                    <Timer className="w-5 h-5" />
                    <span className="font-mono text-xl font-bold">{formatTime(timeLeft)}</span>
                </div>

                <div className="text-sm text-slate-400">
                    <p>Do not close this window or press back</p>
                    <p>Order ID: {orderId}</p>
                </div>
            </div>
        </div>
    );
}

export default function PaymentProcessingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50">Loading...</div>}>
            <PaymentProcessingContent />
        </Suspense>
    );
}
