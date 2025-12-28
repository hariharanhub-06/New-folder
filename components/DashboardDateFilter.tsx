'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar, X, Filter } from 'lucide-react';

export default function DashboardDateFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
    const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');

    const handleApply = () => {
        const params = new URLSearchParams(searchParams.toString());
        if (startDate) params.set('startDate', startDate);
        else params.delete('startDate');

        if (endDate) params.set('endDate', endDate);
        else params.delete('endDate');

        router.push(`/admin?${params.toString()}`);
    };

    const handleClear = () => {
        setStartDate('');
        setEndDate('');
        router.push('/admin');
    };

    const isFiltered = !!(startDate || endDate);

    return (
        <div className="bg-white p-4 border border-gray-100 mb-8 flex flex-wrap items-end gap-4 shadow-sm">
            <div className="flex items-center gap-2 text-black mb-1 md:mb-0 mr-2">
                <Filter className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Filter by Date</span>
            </div>

            <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">From Date</label>
                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="pl-9 pr-3 py-2 border border-gray-200 text-sm focus:ring-1 focus:ring-brand-red focus:border-brand-red outline-none transition-all w-full md:w-auto"
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">To Date</label>
                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="pl-9 pr-3 py-2 border border-gray-200 text-sm focus:ring-1 focus:ring-brand-red focus:border-brand-red outline-none transition-all w-full md:w-auto"
                    />
                </div>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={handleApply}
                    className="px-6 py-2 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-brand-red transition-colors"
                >
                    Apply Filter
                </button>

                {isFiltered && (
                    <button
                        onClick={handleClear}
                        className="px-4 py-2 bg-gray-100 text-gray-500 text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors flex items-center gap-2"
                    >
                        <X className="w-3 h-3" />
                        Clear
                    </button>
                )}
            </div>
        </div>
    );
}
