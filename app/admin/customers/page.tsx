"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Search, Users, CheckCircle, XCircle, ChevronRight, TrendingUp, UserCheck } from 'lucide-react';

interface CustomerRow {
    id: string;
    name: string;
    mobile: string;
    email: string;
    isVerified: boolean;
    createdAt: string;
    orderCount: number;
    totalSpent: number;
}

export default function AdminCustomersPage() {
    const [customers, setCustomers] = useState<CustomerRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetch('/api/admin/customers')
            .then(r => r.json())
            .then(data => { if (data.customers) setCustomers(data.customers); })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const filtered = useMemo(() => {
        if (!search.trim()) return customers;
        const term = search.toLowerCase();
        return customers.filter(c =>
            c.name.toLowerCase().includes(term) ||
            c.mobile.includes(term) ||
            c.email.toLowerCase().includes(term)
        );
    }, [customers, search]);

    const totalSpent = customers.reduce((a, c) => a + c.totalSpent, 0);
    const verifiedCount = customers.filter(c => c.isVerified).length;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-900">Customers</h1>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center">
                        <Users className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Total Customers</p>
                        <p className="text-2xl font-bold text-slate-900 mt-0.5">{customers.length}</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
                    <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center">
                        <UserCheck className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Verified</p>
                        <p className="text-2xl font-bold text-slate-900 mt-0.5">{verifiedCount}</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
                    <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Total Revenue</p>
                        <p className="text-2xl font-bold text-slate-900 mt-0.5">₹{totalSpent.toLocaleString('en-IN')}</p>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name, mobile, or email..."
                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
                />
            </div>

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16">
                        <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-400 font-medium">{search ? 'No customers found' : 'No customers yet'}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50">
                                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Customer</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 hidden sm:table-cell">Mobile</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 hidden lg:table-cell">Email</th>
                                    <th className="text-center px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Verified</th>
                                    <th className="text-center px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 hidden md:table-cell">Orders</th>
                                    <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Spent</th>
                                    <th className="px-5 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map(customer => (
                                    <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-5 py-4">
                                            <p className="font-semibold text-slate-900 text-sm">{customer.name}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                Joined {new Date(customer.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-slate-600 hidden sm:table-cell">{customer.mobile}</td>
                                        <td className="px-5 py-4 text-sm text-slate-600 hidden lg:table-cell truncate max-w-[200px]">{customer.email}</td>
                                        <td className="px-5 py-4 text-center">
                                            {customer.isVerified
                                                ? <CheckCircle className="w-4 h-4 text-green-500 inline" />
                                                : <XCircle className="w-4 h-4 text-slate-300 inline" />
                                            }
                                        </td>
                                        <td className="px-5 py-4 text-center text-sm font-semibold text-slate-700 hidden md:table-cell">{customer.orderCount}</td>
                                        <td className="px-5 py-4 text-right text-sm font-semibold text-slate-900">₹{customer.totalSpent.toLocaleString('en-IN')}</td>
                                        <td className="px-5 py-4">
                                            <Link href={`/admin/customers/${customer.id}`} className="flex items-center justify-end text-slate-400 hover:text-indigo-600 transition-colors">
                                                <ChevronRight className="w-4 h-4" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
