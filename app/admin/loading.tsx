export default function AdminLoading() {
    return (
        <div className="space-y-8 animate-pulse">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="h-10 w-48 bg-slate-200 rounded-lg"></div>
                <div className="h-10 w-64 bg-slate-200 rounded-lg"></div>
            </div>

            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center">
                        <div className="p-4 bg-slate-100 rounded-lg mr-4 w-16 h-16"></div>
                        <div className="space-y-2 flex-1">
                            <div className="h-4 w-24 bg-slate-200 rounded"></div>
                            <div className="h-8 w-32 bg-slate-200 rounded"></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Order Status Skeleton */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="h-6 w-48 bg-slate-200 rounded mb-6"></div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="flex flex-col items-center p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-3">
                            <div className="w-6 h-6 bg-slate-200 rounded-full"></div>
                            <div className="h-8 w-12 bg-slate-200 rounded"></div>
                            <div className="h-3 w-20 bg-slate-200 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Categories Skeleton */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="h-6 w-48 bg-slate-200 rounded mb-6"></div>
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-16 bg-slate-50 rounded-lg border border-slate-100"></div>
                        ))}
                    </div>
                </div>

                {/* Recent Activity Skeleton */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="h-6 w-48 bg-slate-200 rounded mb-6"></div>
                    <div className="space-y-6">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-start pb-6 border-b border-slate-50 last:border-0 last:pb-0">
                                <div className="w-8 h-8 bg-slate-200 rounded-full mr-4"></div>
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 w-3/4 bg-slate-200 rounded"></div>
                                    <div className="h-3 w-1/2 bg-slate-200 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
