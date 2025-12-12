"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Filter, Calendar } from 'lucide-react';

export default function AdminDateFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [from, setFrom] = useState(searchParams.get('from') || '');
    const [to, setTo] = useState(searchParams.get('to') || '');

    useEffect(() => {
        setFrom(searchParams.get('from') || '');
        setTo(searchParams.get('to') || '');
    }, [searchParams]);

    const applyFilter = (start: string, end: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (start) params.set('from', start);
        else params.delete('from');

        if (end) params.set('to', end);
        else params.delete('to');

        router.push(`/admin?${params.toString()}`);
    };

    const handleQuickFilter = (days: number | 'month' | '3months') => {
        const endDate = new Date();
        const startDate = new Date();

        if (typeof days === 'number') {
            startDate.setDate(endDate.getDate() - days);
        } else if (days === 'month') {
            startDate.setMonth(endDate.getMonth() - 1);
        } else if (days === '3months') {
            startDate.setMonth(endDate.getMonth() - 3);
        }

        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];

        setFrom(startStr);
        setTo(endStr);
        applyFilter(startStr, endStr);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilter(from, to);
    };

    const clearFilter = () => {
        setFrom('');
        setTo('');
        router.push('/admin');
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 w-full">
            <div className="flex flex-col gap-4">
                {/* Quick Filters */}
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => handleQuickFilter(3)}
                        className="px-3 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-full hover:bg-indigo-100 transition-colors"
                    >
                        Last 3 Days
                    </button>
                    <button
                        onClick={() => handleQuickFilter(7)}
                        className="px-3 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-full hover:bg-indigo-100 transition-colors"
                    >
                        Last Week
                    </button>
                    <button
                        onClick={() => handleQuickFilter('month')}
                        className="px-3 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-full hover:bg-indigo-100 transition-colors"
                    >
                        Last Month
                    </button>
                    <button
                        onClick={() => handleQuickFilter('3months')}
                        className="px-3 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-full hover:bg-indigo-100 transition-colors"
                    >
                        Last 3 Months
                    </button>
                </div>

                {/* Custom Date Range */}
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <input
                            type="date"
                            value={from}
                            onChange={(e) => setFrom(e.target.value)}
                            className="flex-1 sm:w-auto text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="From"
                        />
                    </div>
                    <span className="hidden sm:inline text-slate-300">-</span>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Calendar className="w-4 h-4 text-slate-400 sm:hidden" />
                        <input
                            type="date"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            className="flex-1 sm:w-auto text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="To"
                        />
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                        <button type="submit" className="flex-1 sm:flex-none bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors">
                            Apply
                        </button>
                        {(from || to) && (
                            <button
                                type="button"
                                onClick={clearFilter}
                                className="flex-1 sm:flex-none px-4 py-2 text-slate-600 hover:text-slate-900 text-sm font-medium border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
