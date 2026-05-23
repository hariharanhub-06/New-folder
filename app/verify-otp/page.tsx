"use client";

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCustomer } from '@/lib/customer-context';

function VerifyOtpContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { refresh: refreshCustomer } = useCustomer();
    const mobile = searchParams.get('mobile') || '';

    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [countdown, setCountdown] = useState(30);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const startCountdown = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setCountdown(30);
        intervalRef.current = setInterval(() => {
            setCountdown(c => {
                if (c <= 1) {
                    clearInterval(intervalRef.current!);
                    intervalRef.current = null;
                    return 0;
                }
                return c - 1;
            });
        }, 1000);
    };

    useEffect(() => {
        startCountdown();
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/customer/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobile, otp }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Verification failed');
                return;
            }
            await refreshCustomer();
            router.push('/account');
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    async function handleResend() {
        setError('');
        setSuccess('');
        try {
            const res = await fetch('/api/customer/resend-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobile }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Failed to resend OTP');
                return;
            }
            setSuccess('OTP resent! Check your inbox and spam folder.');
            startCountdown();
        } catch {
            setError('Failed to resend OTP. Please try again.');
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold uppercase tracking-[0.3em]">Verify Email</h1>
                    <p className="text-sm text-gray-500 mt-2">
                        Enter the 6-digit OTP sent to your email
                    </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 flex items-start gap-3">
                    <span className="text-amber-500 text-lg mt-0.5">💡</span>
                    <div className="text-xs text-amber-800 leading-relaxed">
                        <p className="font-bold mb-0.5">Can't find the OTP?</p>
                        <p>Check your <span className="font-semibold">Spam / Junk</span> folder — automated emails sometimes land there. Mark it as <span className="font-semibold">"Not Spam"</span> to receive future OTPs in your inbox.</p>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">OTP Code</label>
                            <input
                                type="text"
                                value={otp}
                                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="6-digit OTP"
                                required
                                maxLength={6}
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <p className="text-[11px] text-gray-400 mt-1 text-center">OTP expires in 10 minutes</p>
                        </div>

                        {error && (
                            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
                        )}
                        {success && (
                            <p className="text-green-600 text-sm bg-green-50 border border-green-200 rounded-lg px-4 py-3">{success}</p>
                        )}

                        <button
                            type="submit"
                            disabled={loading || otp.length !== 6}
                            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold uppercase tracking-wider text-sm hover:bg-indigo-700 transition-colors disabled:opacity-60"
                        >
                            {loading ? 'Verifying...' : 'Verify OTP'}
                        </button>
                    </form>

                    <div className="text-center mt-6">
                        {countdown > 0 ? (
                            <p className="text-sm text-gray-400">
                                Resend OTP in <span className="font-bold text-indigo-600">{countdown}s</span>
                            </p>
                        ) : (
                            <button
                                onClick={handleResend}
                                className="text-sm text-indigo-600 font-bold hover:underline"
                            >
                                Resend OTP
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function VerifyOtpPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>}>
            <VerifyOtpContent />
        </Suspense>
    );
}
