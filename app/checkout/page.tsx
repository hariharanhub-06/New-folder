"use client";

import { useCart } from '@/lib/cart-context';
import { placeOrder as placeOrderAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Trash2, Tag } from 'lucide-react';
import Image from 'next/image';
import { calculateShipping, calculateTotalWeight, calculateTotalQuantity, calculateShippingByPincode } from '@/lib/shipping';
import { calculateDiscount } from '@/lib/discount';
import { Discount } from '@/lib/types';

declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function CheckoutPage() {
    const { items, addToCart, decrementFromCart, removeFromCart, clearCart, total } = useCart();
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);
    const [pageReady, setPageReady] = useState(false);

    const [error, setError] = useState('');
    const [discounts, setDiscounts] = useState<Discount[]>([]);
    const [discountResult, setDiscountResult] = useState<ReturnType<typeof calculateDiscount> | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        mobile: '',
        street: '',
        city: '',
        state: '',
        country: 'India',
        zipCode: ''
    });

    const [shippingCost, setShippingCost] = useState(0);
    const [shippingDetails, setShippingDetails] = useState<{ zone: string; actualWeight: number; billableWeight: number } | null>(null);

    // Mark page as ready immediately
    useEffect(() => {
        setPageReady(true);
    }, []);

    // Fetch discounts on mount
    useEffect(() => {
        fetch('/api/discounts')
            .then(res => res.json())
            .then(data => setDiscounts(data))
            .catch(err => console.error('Failed to fetch discounts:', err));
    }, []);

    // Calculate discount whenever items or discounts change
    useEffect(() => {
        if (items.length > 0 && discounts.length > 0) {
            const result = calculateDiscount(items, discounts);
            setDiscountResult(result);
        } else {
            setDiscountResult(null);
        }
    }, [items, discounts]);

    // Calculate shipping whenever items, country, or zipCode changes
    useEffect(() => {
        if (formData.country !== 'India') {
            // International shipping
            const weight = calculateTotalWeight(items);
            const cost = calculateShipping(weight, formData.country);
            setShippingCost(cost);
            setShippingDetails(null);
        } else if (formData.zipCode && formData.zipCode.length === 6) {
            // Domestic shipping with pincode
            const totalQuantity = calculateTotalQuantity(items);
            const result = calculateShippingByPincode(totalQuantity, formData.zipCode);
            setShippingCost(result.totalCharges);
            setShippingDetails({
                zone: result.zone,
                actualWeight: result.actualWeight,
                billableWeight: result.billableWeight
            });
        } else {
            // Default shipping (no pincode yet)
            const weight = calculateTotalWeight(items);
            const cost = calculateShipping(weight, formData.country);
            setShippingCost(cost);
            setShippingDetails(null);
        }
    }, [items, formData.country, formData.zipCode]);

    // Load Razorpay Script
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        return () => {
            // Optional: remove script on unmount
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePayment = async () => {
        setIsProcessing(true);
        setError('');

        try {
            const finalSubtotal = discountResult?.discountedTotal || total;
            const paymentGatewayFee = (finalSubtotal + shippingCost) * 0.025;
            const grandTotal = finalSubtotal + shippingCost + paymentGatewayFee;

            // 1. Create Order in Database first
            const orderPayload = {
                customerName: formData.name,
                customerEmail: formData.email,
                customerMobile: formData.mobile,
                shippingAddress: {
                    street: formData.street,
                    city: formData.city,
                    state: formData.state,
                    country: formData.country,
                    zipCode: formData.zipCode
                },
                items: items.map(item => ({
                    productId: item.id,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    size: item.selectedSize  // Include selected size
                })),
                shippingCost: shippingCost + paymentGatewayFee,
                totalAmount: grandTotal,
                status: 'New Order' as const,
                transactionId: '',
            };

            const orderResponse = await placeOrderAPI(orderPayload);
            const orderId = orderResponse.orderId;

            // 2. Create Razorpay Order
            const razorpayRes = await fetch('/api/payment/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId, // Our DB internal ID
                    amount: grandTotal,
                    customerName: formData.name,
                    customerEmail: formData.email,
                    customerPhone: formData.mobile
                })
            });

            const razorpayOrder = await razorpayRes.json();
            if (razorpayOrder.error) throw new Error(razorpayOrder.error);

            // 3. Open Razorpay Checkout
            if (!window.Razorpay) {
                throw new Error("Razorpay SDK failed to load. Please check your connection.");
            }

            const options = {
                key: razorpayOrder.keyId,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                name: "Startup Men's Wear",
                description: `Order #${orderId}`,
                order_id: razorpayOrder.razorpayOrderId,
                handler: async function (response: any) {
                    // Payment Success
                    try {
                        // Verify Payment on Backend
                        const verifyRes = await fetch('/api/payment/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                orderId: orderId
                            })
                        });

                        const verifyData = await verifyRes.json();
                        if (verifyData.success) {
                            clearCart();
                            router.push(`/payment/success?orderId=${orderId}`);
                        } else {
                            throw new Error('Payment verification failed');
                        }
                    } catch (verifyError) {
                        console.error(verifyError);
                        setError('Payment verification failed. Please contact support.');
                    }
                },
                prefill: {
                    name: formData.name,
                    email: formData.email,
                    contact: formData.mobile
                },
                theme: {
                    color: "#4f46e5"
                }
            };

            const rzp1 = new window.Razorpay(options);
            rzp1.on('payment.failed', function (response: any) {
                console.error(response.error);
                setError(`Payment Failed: ${response.error.description}`);
            });
            rzp1.open();

        } catch (err: any) {
            console.error('❌ Payment Error:', err);
            setError(err.message || 'Payment failed. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const isFormValid = () => {
        return formData.name && formData.email && formData.mobile &&
            formData.street && formData.city && formData.state &&
            formData.zipCode && formData.zipCode.length === 6;
    };

    const finalSubtotal = discountResult?.discountedTotal || total;
    const paymentGatewayFee = (finalSubtotal + shippingCost) * 0.025;
    const grandTotal = finalSubtotal + shippingCost + paymentGatewayFee;

    if (items.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Your cart is empty</h2>
                <p className="text-slate-500">Add some premium items to get started.</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">Checkout</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Order Summary */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-fit order-2 lg:order-1">
                    <h2 className="text-xl font-bold text-slate-900 mb-6">Order Summary</h2>
                    <div className="space-y-6">
                        {items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between pb-6 border-b border-slate-50 last:border-0 last:pb-0">
                                <div className="flex items-center space-x-4">
                                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-100">
                                        <Image
                                            src={item.imageUrl}
                                            alt={item.name}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-slate-900">{item.name}</h3>
                                        {item.selectedSize && (
                                            <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded">
                                                Size: {item.selectedSize}
                                            </span>
                                        )}
                                        <div className="flex items-center mt-1 space-x-2">
                                            <button
                                                onClick={() => decrementFromCart(item.id, item.selectedSize)}
                                                className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
                                            >
                                                -
                                            </button>
                                            <span className="text-sm text-slate-500 w-4 text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => addToCart(item, item.selectedSize)}
                                                className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <p className="font-medium text-slate-900">₹{(item.price * item.quantity).toFixed(2)}</p>
                                    <button
                                        onClick={() => removeFromCart(item.id, item.selectedSize)}
                                        className="text-red-500 hover:text-red-600 p-1"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 pt-6 border-t border-slate-100 space-y-2">
                        <div className="flex justify-between items-center text-slate-600">
                            <span>Subtotal</span>
                            <span>₹{total.toFixed(2)}</span>
                        </div>
                        {discountResult && discountResult.appliedDiscounts.length > 0 && (
                            <>
                                <div className="flex justify-between items-center text-green-600 font-medium">
                                    <span className="flex items-center">
                                        <Tag className="w-4 h-4 mr-1" />
                                        Bundle Discount
                                    </span>
                                    <span>-₹{discountResult.totalDiscount.toFixed(2)}</span>
                                </div>
                                {discountResult.appliedDiscounts.map((discount, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-xs text-slate-500 pl-6">
                                        <span>{discount.bundles} × {discount.category} bundle ({discount.quantity} items)</span>
                                        <span>₹{discount.bundlePrice.toFixed(2)}</span>
                                    </div>
                                ))}
                            </>
                        )}
                        <div className="flex justify-between items-center text-slate-600">
                            <span>Shipping</span>
                            <span>₹{(shippingCost + paymentGatewayFee).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-lg font-bold text-slate-900 pt-2 border-t border-slate-100 mt-2">
                            <span>Total</span>
                            <span>₹{grandTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Customer Details Form */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-fit order-1 lg:order-2">
                    <h2 className="text-xl font-bold text-slate-900 mb-6">Customer Details</h2>
                    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Full Name *</label>
                                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-amber-500 focus:border-amber-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                                    Mobile Number * <span className="text-green-600 text-xs font-normal">(WhatsApp)</span>
                                </label>
                                <input type="tel" name="mobile" value={formData.mobile} onChange={handleInputChange} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-amber-500 focus:border-amber-500" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Email Address *</label>
                            <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-amber-500 focus:border-amber-500" />
                        </div>


                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Full Address *</label>
                            <input type="text" name="street" value={formData.street} onChange={handleInputChange} required placeholder="Street Address, Apt, etc." className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-amber-500 focus:border-amber-500" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">City *</label>
                                <input type="text" name="city" value={formData.city} onChange={handleInputChange} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-amber-500 focus:border-amber-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">State *</label>
                                <input type="text" name="state" value={formData.state} onChange={handleInputChange} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-amber-500 focus:border-amber-500" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Country *</label>
                                <select name="country" value={formData.country} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-amber-500 focus:border-amber-500">
                                    <option value="India">India</option>
                                    <option value="United States">United States</option>
                                    <option value="United Kingdom">United Kingdom</option>
                                    <option value="Canada">Canada</option>
                                    <option value="Australia">Australia</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Zip Code *</label>
                                <input type="text" name="zipCode" value={formData.zipCode} onChange={handleInputChange} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-amber-500 focus:border-amber-500" />
                            </div>
                        </div>

                        <div className="mt-8">
                            <button
                                type="button"
                                onClick={handlePayment}
                                disabled={!isFormValid() || isProcessing}
                                className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all ${!isFormValid() || isProcessing
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl'
                                    }`}
                            >
                                {isProcessing ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                    </span>
                                ) : (
                                    `Pay ₹${grandTotal.toFixed(2)}`
                                )}
                            </button>
                            {!isFormValid() && (
                                <p className="text-xs text-center text-red-500 mt-2">
                                    Please fill all details correctly to proceed
                                </p>
                            )}
                            <p className="text-xs text-center text-slate-400 mt-4">
                                Secure payment via Razorpay (UPI, Cards, Netbanking)
                            </p>
                            {error && <p className="text-center text-red-500 text-sm mt-2">{error}</p>}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
