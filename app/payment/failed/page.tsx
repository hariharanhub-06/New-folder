"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { XCircle, RefreshCcw, Home } from 'lucide-react';
import { Suspense } from 'react';

function PaymentFailedContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const reason = searchParams.get('reason');

    const getErrorMessage = () => {
        switch (reason) {
            case 'timeout':
                return 'Payment timed out. Please try again.';
            case 'cancelled':
                return 'Payment was cancelled by user.';
            default:
                return 'Payment failed. Please try again.';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-6">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <XCircle className="w-10 h-10 text-red-600" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-slate-900">Payment Failed</h1>
                    <p className="text-slate-500">{getErrorMessage()}</p>
                </div>

                <div className="space-y-3 pt-4">
                    <button
                        onClick={() => router.push('/checkout')}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-medium"
                    >
                        <RefreshCcw className="w-5 h-5" />
                        Try Again
                    </button>
                    <button
                        onClick={() => router.push('/')}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-medium"
                    >
                        <Home className="w-5 h-5" />
                        Return Home
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function PaymentFailedPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50">Loading...</div>}>
            <PaymentFailedContent />
        </Suspense>
    );
}
