"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Search, Users, CheckCircle, XCircle, ChevronRight } from 'lucide-react';

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
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white uppercase tracking-[0.3em]">Customers</h1>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-black border border-gray-800 rounded-xl p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Customers</p>
                    <p className="text-3xl font-bold text-white mt-1">{customers.length}</p>
                </div>
                <div className="bg-black border border-gray-800 rounded-xl p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Verified</p>
                    <p className="text-3xl font-bold text-white mt-1">{verifiedCount}</p>
                </div>
                <div className="bg-black border border-gray-800 rounded-xl p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Revenue</p>
                    <p className="text-3xl font-bold text-white mt-1">₹{totalSpent.toLocaleString('en-IN')}</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name, mobile, or email..."
                    className="w-full bg-black border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                />
            </div>

            {/* Table */}
            <div className="bg-black border border-gray-800 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16">
                        <Users className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">{search ? 'No customers found' : 'No customers yet'}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-800">
                                    <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">Customer</th>
                                    <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 hidden sm:table-cell">Mobile</th>
                                    <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 hidden lg:table-cell">Email</th>
                                    <th className="text-center px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">Verified</th>
                                    <th className="text-center px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 hidden md:table-cell">Orders</th>
                                    <th className="text-right px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">Spent</th>
                                    <th className="px-5 py-3" />
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(customer => (
                                    <tr key={customer.id} className="border-b border-gray-900 hover:bg-white/5 transition-colors">
                                        <td className="px-5 py-4">
                                            <p className="font-bold text-white text-sm">{customer.name}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                Joined {new Date(customer.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-gray-300 hidden sm:table-cell">{customer.mobile}</td>
                                        <td className="px-5 py-4 text-sm text-gray-300 hidden lg:table-cell truncate max-w-[200px]">{customer.email}</td>
                                        <td className="px-5 py-4 text-center">
                                            {customer.isVerified
                                                ? <CheckCircle className="w-4 h-4 text-green-500 inline" />
                                                : <XCircle className="w-4 h-4 text-gray-600 inline" />
                                            }
                                        </td>
                                        <td className="px-5 py-4 text-center text-sm font-bold text-white hidden md:table-cell">{customer.orderCount}</td>
                                        <td className="px-5 py-4 text-right text-sm font-bold text-white">₹{customer.totalSpent.toLocaleString('en-IN')}</td>
                                        <td className="px-5 py-4">
                                            <Link href={`/admin/customers/${customer.id}`} className="flex items-center justify-end text-gray-500 hover:text-white transition-colors">
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
