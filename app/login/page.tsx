"use client";

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { useCustomer } from '@/lib/customer-context';

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { refresh: refreshCustomer } = useCustomer();
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/customer/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobile, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.needsVerification) {
                    router.push(`/verify-otp?mobile=${encodeURIComponent(mobile)}`);
                    return;
                }
                setError(data.error || 'Login failed');
                return;
            }

            await refreshCustomer();
            const next = searchParams.get('next') || '/account';
            router.push(next);
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold uppercase tracking-[0.3em]">Login</h1>
                    <p className="text-sm text-gray-500 mt-2">Welcome back to Startup Mens Wear</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">Mobile Number</label>
                            <input
                                type="tel"
                                value={mobile}
                                onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                placeholder="10-digit mobile number"
                                required
                                maxLength={10}
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Your password"
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                                <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold uppercase tracking-wider text-sm hover:bg-indigo-700 transition-colors disabled:opacity-60"
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-gray-500 mt-6">
                        New here?{' '}
                        <Link href="/register" className="text-indigo-600 font-bold hover:underline">Create Account</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>}>
            <LoginContent />
        </Suspense>
    );
}
