"use client";

import { Order } from '@/lib/types';

interface InvoiceProps {
    order: Order;
}

export default function Invoice({ order }: InvoiceProps) {
    const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = order.shippingCost || 0;
    const totalBeforeFee = subtotal + shipping;
    const gatewayFee = order.totalAmount - totalBeforeFee;
    const total = order.totalAmount;

    return (
        <div className="max-w-4xl mx-auto bg-white p-12 shadow-lg">
            {/* Header with Tuxedo Logo */}
            <div className="flex items-start gap-4 mb-8">
                {/* Tuxedo Logo */}
                <div className="relative w-20 h-20">
                    <svg viewBox="0 0 100 120" className="w-full h-full">
                        {/* Bow Tie */}
                        <path d="M30 25 L20 30 L30 35 L40 30 Z M60 25 L70 30 L60 35 L50 30 Z M40 30 L50 30"
                            fill="#D4AF37" stroke="#D4AF37" strokeWidth="1" />
                        {/* Tuxedo Jacket */}
                        <path d="M20 40 L20 100 L35 110 L50 100 L65 110 L80 100 L80 40 L70 35 L60 50 L50 45 L40 50 L30 35 Z"
                            fill="#1a1a1a" stroke="#1a1a1a" />
                        {/* White Shirt */}
                        <path d="M40 40 L40 90 L50 85 L60 90 L60 40 Z"
                            fill="white" stroke="#e5e5e5" />
                        {/* Buttons */}
                        <circle cx="50" cy="55" r="2" fill="#D4AF37" />
                        <circle cx="50" cy="65" r="2" fill="#D4AF37" />
                        <circle cx="50" cy="75" r="2" fill="#D4AF37" />
                    </svg>
                </div>

                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-black" style={{ letterSpacing: '0.05em' }}>STARTUP</h1>
                    <h2 className="text-4xl font-bold tracking-tight text-black" style={{ letterSpacing: '0.05em' }}>MENS WEAR</h2>
                    <div className="mt-3 text-xs text-black space-y-0.5">
                        <p className="font-semibold">CUSTOMER SUPPORT: +91 80151 03119</p>
                        <p>160/1, CAR ST, SOWRI PALAYAM,</p>
                        <p>COIMBATORE, TAMIL NADU 641028</p>
                    </div>
                </div>
            </div>

            {/* Customer and Order Details */}
            <div className="grid grid-cols-2 gap-8 mb-8 mt-12">
                <div>
                    <p className="font-bold mb-3 text-xs tracking-wider text-black">ISSUED TO:</p>
                    <p className="text-sm text-black">{order.customerName}</p>
                    <p className="text-sm text-black">{order.customerMobile}</p>
                    <p className="text-sm text-black">{order.shippingAddress.street}</p>
                </div>
                <div className="text-right">
                    <p className="font-bold text-xs tracking-wider text-black">ORDER ID:</p>
                    <p className="font-mono text-sm mb-3 text-black">{order.id.substring(0, 7)}</p>
                    <p className="font-bold text-xs tracking-wider text-black">DATE: {new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.')}</p>
                </div>
            </div>

            {/* Items Table */}
            <table className="w-full mb-8">
                <thead>
                    <tr className="border-b border-black">
                        <th className="text-left py-3 font-bold text-xs tracking-wider text-black">DESCRIPTION</th>
                        <th className="text-center py-3 font-bold text-xs tracking-wider text-black">UNIT PRICE</th>
                        <th className="text-center py-3 font-bold text-xs tracking-wider text-black">QTY</th>
                        <th className="text-right py-3 font-bold text-xs tracking-wider text-black">TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    {order.items.map((item, index) => (
                        <tr key={index} className="border-b border-gray-200">
                            <td className="py-4 text-sm text-black">{item.name}</td>
                            <td className="text-center py-4 text-sm text-black">{item.price}</td>
                            <td className="text-center py-4 text-sm text-black">{item.quantity}</td>
                            <td className="text-right py-4 text-sm text-black">₹{(item.price * item.quantity)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals Section */}
            <div className="border-t-2 border-black pt-4 mb-8">
                <div className="flex justify-between mb-2">
                    <span className="font-bold text-sm tracking-wider text-black">SUBTOTAL</span>
                    <span className="font-bold text-sm text-black">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-2">
                    <span className="font-bold text-sm tracking-wider text-black">SHIPPING</span>
                    <span className="font-bold text-sm text-black">₹{shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-2">
                    <span className="font-bold text-sm tracking-wider text-black">GATEWAY FEE (2.5%)</span>
                    <span className="font-bold text-sm text-black">₹{gatewayFee.toFixed(2)}</span>
                </div>
            </div>

            {/* Final Totals */}
            <div className="flex justify-end mb-16">
                <div className="w-72 space-y-2 text-sm">
                    <div className="flex justify-between font-bold text-base border-t border-black pt-2 mt-2 text-black">
                        <span>Amount due</span>
                        <span>₹{total.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Thank You */}
            <div className="mt-12">
                <p className="text-5xl text-black" style={{ fontFamily: 'Brush Script MT, cursive', lineHeight: '1.2' }}>
                    thank<br />You
                </p>
            </div>

            {/* Print Button */}
            <div className="mt-8 flex gap-4 print:hidden">
                <button
                    onClick={() => window.print()}
                    className="px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                    Print Invoice
                </button>
                <button
                    onClick={() => {
                        window.print();
                    }}
                    className="px-6 py-3 border border-slate-900 text-slate-900 rounded-lg hover:bg-slate-50 transition-colors"
                >
                    Download PDF
                </button>
            </div>
        </div>
    );
}
