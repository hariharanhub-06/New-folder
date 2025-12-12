export default function ShopLoading() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="h-8 w-48 bg-slate-200 rounded"></div>
                <div className="h-10 w-full md:w-64 bg-slate-200 rounded-lg"></div>
            </div>

            {/* Filters Skeleton */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <div className="h-4 w-20 bg-slate-200 rounded"></div>
                        <div className="h-10 w-full bg-slate-200 rounded-lg"></div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-4 w-20 bg-slate-200 rounded"></div>
                        <div className="h-10 w-full bg-slate-200 rounded-lg"></div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-4 w-20 bg-slate-200 rounded"></div>
                        <div className="h-10 w-full bg-slate-200 rounded-lg"></div>
                    </div>
                </div>
            </div>

            {/* Product Grid Skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
                        <div className="aspect-[4/5] bg-slate-200"></div>
                        <div className="p-3 space-y-2">
                            <div className="h-3 w-16 bg-slate-200 rounded"></div>
                            <div className="h-4 w-3/4 bg-slate-200 rounded"></div>
                            <div className="flex justify-between items-center pt-1">
                                <div className="h-4 w-12 bg-slate-200 rounded"></div>
                                <div className="h-6 w-6 bg-slate-200 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
