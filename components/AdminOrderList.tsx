import { Order } from '@/lib/types';
import { useState, useMemo } from 'react';
import { updateOrderStatus } from '@/lib/actions';
import { Loader2, Search, Calendar, Download, Filter, Eye, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminOrderList({ orders: initialOrders }: { orders: Order[] }) {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>(initialOrders);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [logisticsId, setLogisticsId] = useState('');
    const [courierName, setCourierName] = useState('');
    const [showLogisticsModal, setShowLogisticsModal] = useState<string | null>(null);
    const [viewAddressOrder, setViewAddressOrder] = useState<Order | null>(null);

    // Filters
    const [searchId, setSearchId] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            // Search by ID
            if (searchId && !order.id.toLowerCase().includes(searchId.toLowerCase())) {
                return false;
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
        // Optimistic update - update UI immediately
        setOrders(prevOrders =>
            prevOrders.map(order =>
                order.id === orderId
                    ? {
                        ...order,
                        status: status as Order['status'],
                        logisticsId: logistics || order.logisticsId,
                        courierName: courier || order.courierName,
                        updatedAt: new Date().toISOString()
                    }
                    : order
            )
        );

        setUpdatingId(orderId);
        try {
            // Update in background
            await updateOrderStatus(orderId, status as any, logistics, courier);
            // Refresh data in background without blocking UI
            setTimeout(() => router.refresh(), 100);
        } catch (error) {
            console.error("Failed to update status", error);
            alert("Failed to update status: " + (error as Error).message);
            // Revert optimistic update on error
            setOrders(initialOrders);
        } finally {
            setUpdatingId(null);
        }
    };

    const generateInvoice = (order: Order) => {
        // Open invoice in new window
        const invoiceUrl = `/invoice/${order.id}`;
        window.open(invoiceUrl, '_blank', 'width=800,height=1000');
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'New Order': return 'bg-blue-100 text-blue-800';
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
            {/* Filters & Search Bar */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Search Order ID</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search ID..."
                            value={searchId}
                            onChange={(e) => setSearchId(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
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
                        <option value="New Order">New Order</option>
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
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Info</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
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
                                filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="text-sm font-bold text-gray-900">#{order.id.slice(0, 8)}</div>
                                                <button
                                                    onClick={() => setViewAddressOrder(order)}
                                                    className="p-1 hover:bg-gray-100 rounded-full text-gray-500 hover:text-indigo-600 transition-colors"
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
                                            <div className="text-sm font-medium text-gray-900 mt-1">₹{order.totalAmount.toFixed(2)}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="font-medium text-gray-900">{order.customerName}</div>
                                            <div className="text-xs text-gray-400">{order.customerEmail}</div>
                                            <div className="text-xs text-gray-400">{order.customerMobile}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                            {order.logisticsId && (
                                                <div className="text-xs text-gray-500 mt-1 font-mono bg-gray-100 px-2 py-0.5 rounded inline-block">
                                                    Ref: {order.logisticsId}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {order.updatedAt ? (
                                                <>
                                                    <div>{formatDate(order.updatedAt)}</div>
                                                    <div className="text-xs text-gray-400">{formatTime(order.updatedAt)}</div>
                                                </>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex flex-col space-y-2">
                                                <select
                                                    disabled={updatingId === order.id}
                                                    value={order.status}
                                                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                                    className="block w-full pl-3 pr-8 py-1 text-xs border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                                                >
                                                    <option value="New Order">New Order</option>
                                                    <option value="Payment Confirmed">Payment Confirmed</option>
                                                    <option value="Parcel Prepared">Parcel Prepared</option>
                                                    <option value="Couried">Couried</option>
                                                    <option value="Delivered">Delivered</option>
                                                    <option value="Cancelled">Cancelled</option>
                                                </select>

                                                {order.status !== 'New Order' && order.status !== 'Cancelled' && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => generateInvoice(order)}
                                                            className="flex-1 flex items-center justify-center px-3 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                                                            title="Download Invoice"
                                                        >
                                                            <Download className="w-3 h-3 mr-1" />
                                                            Invoice
                                                        </button>

                                                        {order.status === 'Couried' && (
                                                            <button
                                                                onClick={() => {
                                                                    const message = `Hello ${order.customerName},\n\nYour order #${order.id.slice(0, 8)} has been shipped via ${order.courierName || 'Partner'}!\n\nTracking ID: ${order.logisticsId}\n\nYou can track your package using this number.\n\nThank you for shopping with Startup Mens Wear!`;
                                                                    const url = `https://wa.me/91${order.customerMobile.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
                                                                    window.open(url, '_blank');
                                                                }}
                                                                className="flex items-center justify-center px-2 py-1 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-md transition-colors"
                                                                title="Send Update on WhatsApp"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Logistics ID & Courier Name Modal */}
                {showLogisticsModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
                            <h3 className="text-lg font-bold mb-4 text-gray-900">Enter Shipping Details</h3>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Courier Name</label>
                                    <input
                                        type="text"
                                        value={courierName}
                                        onChange={(e) => setCourierName(e.target.value)}
                                        placeholder="e.g. DTDC, FedEx"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tracking Number</label>
                                    <input
                                        type="text"
                                        value={logisticsId}
                                        onChange={(e) => setLogisticsId(e.target.value)}
                                        placeholder="Tracking / Waybill No"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-2">
                                <button
                                    onClick={() => setShowLogisticsModal(null)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmCourier}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                                >
                                    Update Status
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Address Details Modal */}
                {viewAddressOrder && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-slate-800">Order Details</h3>
                                <button
                                    onClick={() => setViewAddressOrder(null)}
                                    className="text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Customer Info */}
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Customer Information</h4>
                                    <div className="bg-slate-50 p-3 rounded-lg space-y-1">
                                        <p className="font-medium text-slate-900">{viewAddressOrder.customerName}</p>
                                        <p className="text-sm text-slate-600">{viewAddressOrder.customerEmail}</p>
                                        <p className="text-sm text-slate-600">{viewAddressOrder.customerMobile}</p>
                                    </div>
                                </div>

                                {/* Shipping Address */}
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Shipping Address</h4>
                                    <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-700 space-y-1">
                                        <p>{viewAddressOrder.shippingAddress.street}</p>
                                        <p>{viewAddressOrder.shippingAddress.city}, {viewAddressOrder.shippingAddress.state}</p>
                                        <p>{viewAddressOrder.shippingAddress.country} - <span className="font-mono font-medium text-slate-900">{viewAddressOrder.shippingAddress.zipCode}</span></p>
                                    </div>
                                </div>

                                {/* Order Items Summary (Optional but helpful) */}
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Items</h4>
                                    <div className="text-sm space-y-2">
                                        {viewAddressOrder.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between border-b border-slate-50 last:border-0 pb-1 last:pb-0">
                                                <span className="text-slate-700">{item.name} <span className="text-slate-400">x{item.quantity}</span></span>
                                                <span className="font-medium text-slate-900">₹{item.price}</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between pt-2 font-bold text-slate-900 border-t border-slate-100">
                                            <span>Total</span>
                                            <span>₹{viewAddressOrder.totalAmount.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 px-6 py-4 flex justify-end">
                                <button
                                    onClick={() => setViewAddressOrder(null)}
                                    className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
