import { Order } from '@/lib/types';
import { useState, useMemo, useEffect } from 'react';
import { updateOrderStatus, removeOrder, updateOrderDetails, syncRazorpayPayments } from '@/lib/actions';
import { Loader2, Search, Calendar, Download, Filter, Eye, X, Edit2, Trash2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const ITEMS_PER_PAGE = 25;

export default function AdminOrderList({ orders: initialOrders }: { orders: Order[] }) {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>(initialOrders);
    const [currentPage, setCurrentPage] = useState(1);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [logisticsId, setLogisticsId] = useState('');
    const [courierName, setCourierName] = useState('');
    const [showLogisticsModal, setShowLogisticsModal] = useState<string | null>(null);
    const [viewAddressOrder, setViewAddressOrder] = useState<Order | null>(null);
    const [editOrder, setEditOrder] = useState<Order | null>(null);

    // Filters
    const [searchId, setSearchId] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            // Search by ID or Name
            if (searchId) {
                const term = searchId.toLowerCase();
                if (!order.id.toLowerCase().includes(term) &&
                    !order.customerName.toLowerCase().includes(term) &&
                    !(order.razorpayPaymentId || '').toLowerCase().includes(term)) {
                    return false;
                }
            }

            // Filter by Status
            if (statusFilter !== 'All' && order.status !== statusFilter) {
                return false;
            }

            // Filter by Date Range
            if (dateRange.start) {
                const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
                if (orderDate < dateRange.start) return false;
            }
            if (dateRange.end) {
                const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
                if (orderDate > dateRange.end) return false;
            }

            return true;
        });
    }, [orders, searchId, statusFilter, dateRange]);

    // Pagination Calculations
    const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
    const paginatedOrders = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredOrders, currentPage]);

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchId, statusFilter, dateRange]);

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        if (newStatus === 'Couried') {
            setShowLogisticsModal(orderId);
            return;
        }

        await performUpdate(orderId, newStatus);
    };

    const confirmCourier = async () => {
        if (!showLogisticsModal || !logisticsId.trim() || !courierName.trim()) return;
        await performUpdate(showLogisticsModal, 'Couried', logisticsId, courierName);
        setShowLogisticsModal(null);
        setLogisticsId('');
        setCourierName('');
    };

    const performUpdate = async (orderId: string, status: string, logistics?: string, courier?: string) => {
        setUpdatingId(orderId);
        try {
            await updateOrderStatus(orderId, status as any, logistics, courier);
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: status as any, logisticsId: logistics || o.logisticsId, courierName: courier || o.courierName } : o));
            router.refresh();
        } catch (error) {
            console.error("Failed to update status", error);
            alert("Failed to update status");
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDelete = async (orderId: string) => {
        if (!confirm("Are you sure you want to delete this order? This action cannot be undone.")) return;

        setUpdatingId(orderId);
        try {
            await removeOrder(orderId);
            setOrders(prev => prev.filter(o => o.id !== orderId));
            router.refresh();
        } catch (error) {
            console.error("Delete failed", error);
            alert("Failed to delete order");
        } finally {
            setUpdatingId(null);
        }
    };

    const handleEditSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editOrder) return;

        setUpdatingId(editOrder.id);
        try {
            await updateOrderDetails(editOrder.id, {
                customerName: editOrder.customerName,
                customerEmail: editOrder.customerEmail,
                customerMobile: editOrder.customerMobile,
                shippingAddress: editOrder.shippingAddress
            });
            setOrders(prev => prev.map(o => o.id === editOrder.id ? editOrder : o));
            setEditOrder(null);
            router.refresh();
        } catch (error) {
            console.error("Update failed", error);
            alert("Failed to update order details");
        } finally {
            setUpdatingId(null);
        }
    };

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            const res = await syncRazorpayPayments();
            if (res.success) {
                alert(`Sync complete! ${res.count} new orders recovered.`);
                router.refresh();
                // Optionally reload window to get fresh orders from server
                window.location.reload();
            }
        } catch (error) {
            console.error("Sync failed", error);
            alert("Sync failed. Check console for details.");
        } finally {
            setIsSyncing(false);
        }
    };

    const generateInvoice = (order: Order) => {
        const invoiceUrl = `/invoice/${order.id}`;
        window.open(invoiceUrl, '_blank', 'width=800,height=1000');
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Payment Confirmed': return 'bg-indigo-100 text-indigo-800';
            case 'Parcel Prepared': return 'bg-amber-100 text-amber-800';
            case 'Couried': return 'bg-purple-100 text-purple-800';
            case 'Delivered': return 'bg-green-100 text-green-800';
            case 'Cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="space-y-4">
            {/* Sync Header */}
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-slate-100">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin text-indigo-500' : 'text-slate-400'}`} />
                    Razorpay Sync
                </h2>
                <button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                    {isSyncing ? 'Syncing...' : 'Sync Razorpay Orders'}
                </button>
            </div>

            {/* Filters & Search Bar */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Search Orders</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search ID, Name or Payment ID..."
                            value={searchId}
                            onChange={(e) => setSearchId(e.target.value)}
                            className="w-full pl-9 pr-10 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        {searchId && (
                            <button
                                onClick={() => setSearchId('')}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                title="Clear search"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="w-40">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="All">All Statuses</option>
                        <option value="Payment Confirmed">Payment Confirmed</option>
                        <option value="Parcel Prepared">Parcel Prepared</option>
                        <option value="Couried">Couried</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>

                <div className="flex gap-2">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">From Date</label>
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">To Date</label>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-slate-200">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Info</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Details</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                                        No orders found matching your filters.
                                    </td>
                                </tr>
                            ) : (
                                paginatedOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50 relative group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="text-sm font-bold text-gray-900">
                                                    {order.id.startsWith('REC-') ? (
                                                        <span className="flex items-center gap-1 text-amber-600">
                                                            <RefreshCw className="w-3 h-3" />
                                                            {order.id}
                                                        </span>
                                                    ) : (
                                                        `#${order.id.slice(0, 8)}`
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => setViewAddressOrder(order)}
                                                    className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-indigo-600 transition-colors"
                                                    title="View Full Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="text-xs text-gray-500 flex items-center mt-1">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                {formatDate(order.createdAt)}
                                            </div>
                                            <div className="text-xs text-gray-400 ml-4">
                                                {formatTime(order.createdAt)}
                                            </div>
                                            <div className="text-sm font-bold text-indigo-600 mt-1">₹{order.totalAmount.toFixed(2)}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex items-center gap-2">
                                                <div className="font-semibold text-gray-900">{order.customerName}</div>
                                                <button
                                                    onClick={() => setEditOrder(order)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-amber-600 transition-all"
                                                    title="Edit Details"
                                                >
                                                    <Edit2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <div className="text-xs text-gray-400">{order.customerEmail}</div>
                                            <div className="text-xs text-gray-400">{order.customerMobile}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                            {order.logisticsId && (
                                                <div className="text-xs text-gray-500 mt-1 font-mono bg-gray-100 px-2 py-0.5 rounded block w-fit">
                                                    TR: {order.logisticsId}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-gray-400 font-medium">PayID:</span>
                                                    <span className="font-mono bg-slate-50 px-1 rounded">{order.razorpayPaymentId || order.transactionId || 'N/A'}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-gray-400 font-medium">OrdID:</span>
                                                    <span className="font-mono text-[10px]">{order.razorpayOrderId || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex flex-col space-y-2">
                                                <select
                                                    disabled={updatingId === order.id}
                                                    value={order.status}
                                                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                                    className="block w-full pl-3 pr-8 py-1.5 text-xs font-medium border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md bg-white shadow-sm"
                                                >
                                                    <option value="Payment Confirmed">Payment Confirmed</option>
                                                    <option value="Parcel Prepared">Parcel Prepared</option>
                                                    <option value="Couried">Couried</option>
                                                    <option value="Delivered">Delivered</option>
                                                    <option value="Cancelled">Cancelled</option>
                                                </select>

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => generateInvoice(order)}
                                                        className="flex-1 flex items-center justify-center px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-all border border-indigo-100"
                                                        title="Download Invoice"
                                                    >
                                                        <Download className="w-3 h-3 mr-1" />
                                                        Invoice
                                                    </button>

                                                    <button
                                                        onClick={() => handleDelete(order.id)}
                                                        disabled={updatingId === order.id}
                                                        className="flex items-center justify-center px-2 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-all border border-red-100"
                                                        title="Delete Order"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination UI */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
                        <div className="text-sm text-slate-500">
                            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)} of {filteredOrders.length} orders
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-white hover:border-slate-400 hover:text-indigo-600 bg-white shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                                title="Previous Page"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`px-3 py-1 rounded-lg font-bold text-sm transition-all focus:ring-2 focus:ring-indigo-200 ${currentPage === pageNum
                                                ? 'bg-indigo-600 text-white shadow-md border-transparent'
                                                : 'border border-slate-300 text-slate-600 hover:bg-white hover:border-slate-400 hover:text-indigo-600 bg-white'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-white hover:border-slate-400 hover:text-indigo-600 bg-white shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                                title="Next Page"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Logistics Modal (Reuse existing logic) */}
                {showLogisticsModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                        <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl border border-slate-100">
                            <h3 className="text-lg font-bold mb-4 text-gray-900">Shipping Details</h3>
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Courier Name</label>
                                    <input
                                        type="text"
                                        value={courierName}
                                        onChange={(e) => setCourierName(e.target.value)}
                                        placeholder="e.g. DTDC, Delhivery"
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tracking ID</label>
                                    <input
                                        type="text"
                                        value={logisticsId}
                                        onChange={(e) => setLogisticsId(e.target.value)}
                                        placeholder="Tracking Number"
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button onClick={() => setShowLogisticsModal(null)} className="px-4 py-2 text-slate-500 text-sm font-semibold hover:bg-slate-50 rounded-lg">Cancel</button>
                                <button onClick={confirmCourier} className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-indigo-200">Update Status</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Details Modal */}
                {editOrder && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                        <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
                            <form onSubmit={handleEditSave} className="flex flex-col h-full overflow-hidden">
                                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-slate-800">Edit Order Details</h3>
                                    <button type="button" onClick={() => setEditOrder(null)} className="text-slate-400 hover:text-slate-600">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Customer Name</label>
                                            <input
                                                type="text"
                                                value={editOrder.customerName}
                                                onChange={e => setEditOrder({ ...editOrder, customerName: e.target.value })}
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mobile</label>
                                            <input
                                                type="tel"
                                                value={editOrder.customerMobile}
                                                onChange={e => setEditOrder({ ...editOrder, customerMobile: e.target.value })}
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                                            <input
                                                type="email"
                                                value={editOrder.customerEmail}
                                                onChange={e => setEditOrder({ ...editOrder, customerEmail: e.target.value })}
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Street Address</label>
                                        <input
                                            type="text"
                                            value={editOrder.shippingAddress.street}
                                            onChange={e => setEditOrder({ ...editOrder, shippingAddress: { ...editOrder.shippingAddress, street: e.target.value } })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none mb-3"
                                        />

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">City</label>
                                                <input
                                                    type="text"
                                                    value={editOrder.shippingAddress.city}
                                                    onChange={e => setEditOrder({ ...editOrder, shippingAddress: { ...editOrder.shippingAddress, city: e.target.value } })}
                                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Zip Code</label>
                                                <input
                                                    type="text"
                                                    value={editOrder.shippingAddress.zipCode}
                                                    onChange={e => setEditOrder({ ...editOrder, shippingAddress: { ...editOrder.shippingAddress, zipCode: e.target.value } })}
                                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-50 px-6 py-4 flex justify-end space-x-3 border-t border-slate-200">
                                    <button type="button" onClick={() => setEditOrder(null)} className="px-4 py-2 text-slate-600 font-semibold text-sm hover:bg-white rounded-lg transition-all">Cancel</button>
                                    <button
                                        type="submit"
                                        disabled={updatingId === editOrder.id}
                                        className="px-6 py-2 bg-indigo-600 text-white font-bold text-sm rounded-lg shadow-lg shadow-indigo-100 flex items-center gap-2"
                                    >
                                        {updatingId === editOrder.id ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* View Details Modal (Reuse existing logic) */}

                {viewAddressOrder && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                        <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
                            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-white">Order Details Overview</h3>
                                <button onClick={() => setViewAddressOrder(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="p-6 space-y-6 overflow-y-auto flex-1">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Customer & Contact</h4>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                                        <p className="font-bold text-slate-900">{viewAddressOrder.customerName}</p>
                                        <p className="text-sm text-slate-600">{viewAddressOrder.customerEmail}</p>
                                        <p className="text-sm font-medium text-indigo-600">{viewAddressOrder.customerMobile}</p>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Shipping Information</h4>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-700 leading-relaxed">
                                        <p className="font-semibold">{viewAddressOrder.shippingAddress.street}</p>
                                        <p>{viewAddressOrder.shippingAddress.city}, {viewAddressOrder.shippingAddress.state}</p>
                                        <p>{viewAddressOrder.shippingAddress.country} - <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">{viewAddressOrder.shippingAddress.zipCode}</span></p>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Item Summary</h4>
                                    <div className="space-y-4">
                                        {viewAddressOrder.items.map((item, idx) => (
                                            <div key={idx} className="flex gap-4 pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                                                {/* Product Image */}
                                                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                                                    {item.imageUrl ? (
                                                        <Image
                                                            src={item.imageUrl}
                                                            alt={item.name}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                            <Eye className="w-6 h-6 opacity-20" />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="font-bold text-slate-800 truncate">{item.name}</span>
                                                        <span className="font-bold text-slate-900 ml-2">₹{item.price}</span>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                                        {item.size && (
                                                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase rounded border border-indigo-100">
                                                                Size: {item.size}
                                                            </span>
                                                        )}
                                                        <span className="text-xs text-slate-500 font-medium tracking-tight">
                                                            Qty: <span className="text-slate-900">{item.quantity}</span>
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-1.5 pt-1 border-t border-slate-50">
                                                        <span className="text-[10px] font-bold text-slate-300 uppercase">Item ID:</span>
                                                        <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded truncate select-all" title={item.id}>
                                                            {item.id.slice(0, 13)}...
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        <div className="pt-2">
                                            <div className="flex justify-between items-center text-slate-500 text-sm mb-1">
                                                <span>Subtotal</span>
                                                <span className="font-medium">₹{(viewAddressOrder.totalAmount - viewAddressOrder.shippingCost).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-slate-500 text-sm mb-3">
                                                <span>Shipping</span>
                                                <span className="font-medium">₹{viewAddressOrder.shippingCost.toFixed(2)}</span>
                                            </div>
                                            <div className="pt-3 border-t-2 border-slate-100 flex justify-between items-center font-black text-xl text-slate-900">
                                                <span className="tracking-tight uppercase text-xs text-slate-400">Total Paid</span>
                                                <span className="text-indigo-600 font-mono">₹{viewAddressOrder.totalAmount.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
