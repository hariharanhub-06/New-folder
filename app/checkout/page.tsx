"use client";

import { useCart } from '@/lib/cart-context';
import { useCustomer } from '@/lib/customer-context';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Trash2, Tag, MapPin, Check, Smartphone, CreditCard, Building2, Wallet, ShieldCheck, Lock } from 'lucide-react';
import Image from 'next/image';
import { calculateShipping, calculateTotalWeight, calculateShippingByPincode } from '@/lib/shipping';
import { calculateDiscount } from '@/lib/discount';
import { Discount } from '@/lib/types';

declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function CheckoutPage() {
    const { items, addToCart, decrementFromCart, removeFromCart, clearCart, total } = useCart();
    const { customer } = useCustomer();
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);
    const [pageReady, setPageReady] = useState(false);
    const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [saveAddress, setSaveAddress] = useState(false);

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
    const pincodeAbortRef = useRef<AbortController | null>(null);

    type CheckoutStep = 'details' | 'payment-selection';
    const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('details');
    type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'wallet' | null;
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(null);
    const [upiId, setUpiId] = useState('');
    const [selectedBank, setSelectedBank] = useState('');
    const [selectedWallet, setSelectedWallet] = useState('');

    // Mark page as ready + pre-fill customer data + load saved addresses
    useEffect(() => {
        setPageReady(true);
        fetch('/api/customer/me')
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data?.customer) {
                    setFormData(prev => ({
                        ...prev,
                        name: prev.name || data.customer.name,
                        email: prev.email || data.customer.email,
                        mobile: prev.mobile || data.customer.mobile,
                    }));
                }
            })
            .catch(() => {});
        fetch('/api/customer/addresses')
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data?.addresses?.length) {
                    setSavedAddresses(data.addresses);
                    const def = data.addresses.find((a: any) => a.is_default) || data.addresses[0];
                    setSelectedAddressId(def.id);
                    setFormData(prev => ({
                        ...prev,
                        name: prev.name || def.name,
                        mobile: prev.mobile || def.mobile,
                        street: def.street, city: def.city, state: def.state,
                        country: def.country, zipCode: def.pincode,
                    }));
                }
            })
            .catch(() => {});
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
        const weight = calculateTotalWeight(items);

        if (formData.country !== 'India') {
            // International shipping
            const cost = calculateShipping(weight, formData.country);
            setShippingCost(cost);
            setShippingDetails(null);
        } else if (formData.zipCode && formData.zipCode.length === 6) {
            // Domestic shipping with pincode
            // Updated to pass WEIGHT instead of Quantity
            const result = calculateShippingByPincode(weight, formData.zipCode);
            setShippingCost(result.totalCharges);
            setShippingDetails({
                zone: result.zone,
                actualWeight: result.actualWeight,
                billableWeight: result.billableWeight
            });
        } else {
            // Default shipping (no pincode yet)
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

        // Only allow numeric input and limit to 10 digits for mobile
        if (name === 'mobile') {
            const numericValue = value.replace(/\D/g, '');
            if (numericValue.length <= 10) {
                setFormData(prev => ({ ...prev, [name]: numericValue }));
            }
            return;
        }

        // Only allow 6 digits for zipCode
        if (name === 'zipCode') {
            const numericValue = value.replace(/\D/g, '');
            if (numericValue.length <= 6) {
                setFormData(prev => ({ ...prev, [name]: numericValue }));

                // Auto-fill address detail when zipCode is 6 digits
                if (numericValue.length === 6) {
                    if (pincodeAbortRef.current) pincodeAbortRef.current.abort();
                    const controller = new AbortController();
                    pincodeAbortRef.current = controller;
                    fetch(`https://api.postalpincode.in/pincode/${numericValue}`, { signal: controller.signal })
                        .then(res => res.json())
                        .then(data => {
                            const postOffice = data[0]?.PostOffice?.[0];
                            if (data[0]?.Status === "Success" && postOffice) {
                                setFormData(prev => ({
                                    ...prev,
                                    city: postOffice.District,
                                    state: postOffice.State,
                                    country: 'India'
                                }));
                            }
                        })
                        .catch(err => {
                            if (err.name !== 'AbortError') console.error('Pincode fetch failed:', err);
                        });
                }
            }
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePayment = async () => {
        setIsProcessing(true);
        setError('');

        // Save address if checkbox checked and no saved address selected
        if (saveAddress && customer && !selectedAddressId) {
            try {
                await fetch('/api/customer/addresses', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        label: 'Home', name: formData.name, mobile: formData.mobile,
                        street: formData.street, city: formData.city, state: formData.state,
                        country: formData.country, pincode: formData.zipCode, isDefault: savedAddresses.length === 0,
                    }),
                });
            } catch { /* non-fatal */ }
        }

        try {
            // Updated Flow:
            // 1. Initiate Razorpay Order (Calculate Total Server-Side)
            // 2. Open Gateway
            // 3. On Success -> Create Order in DB (Verify Signature)

            // 1. Initiate Razorpay Order
            const razorpayRes = await fetch('/api/payment/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: items.map(item => ({
                        id: item.id,
                        name: item.name, // Required by DB
                        price: item.price,
                        quantity: item.quantity,
                        weight: item.weight,
                        imageUrl: item.imageUrl,
                        selectedSize: item.selectedSize
                    })),
                    address: {
                        street: formData.street,
                        city: formData.city,
                        state: formData.state,
                        country: formData.country,
                        zipCode: formData.zipCode
                    },
                    customerName: formData.name,
                    customerEmail: formData.email,
                    customerMobile: formData.mobile,
                })
            });

            const razorpayOrder = await razorpayRes.json();
            console.log("✅ Razorpay Order Initiation Result:", razorpayOrder);
            if (razorpayOrder.error) throw new Error(razorpayOrder.error);

            // Capture Shadow Order ID
            const shadowOrderId = razorpayOrder.dbOrderId;

            // 2. Open Razorpay Checkout
            if (!window.Razorpay) {
                console.error("❌ Razorpay SDK not found on window object");
                throw new Error("Razorpay SDK failed to load. Please check your connection or try refreshing the page.");
            }

            console.log("🚀 Initializing Razorpay modal with Key:", razorpayOrder.keyId);

            const options: any = {
                key: razorpayOrder.keyId,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                name: "Startup Men's Wear",
                description: "Payment for Order",
                order_id: razorpayOrder.razorpayOrderId,
                config: {
                    display: {
                        sequence: selectedPaymentMethod
                            ? [selectedPaymentMethod, ...(['upi','card','netbanking','wallet'].filter(m => m !== selectedPaymentMethod))]
                            : ['upi', 'card', 'netbanking', 'wallet'],
                        preferences: { show_default_blocks: true }
                    }
                },
                callback_url: `${window.location.origin}/api/payment/callback?dbOrderId=${shadowOrderId}`,
                redirect: true,
                handler: async function (response: any) {
                    console.log("✅ Payment Success Handler Triggered:", response);
                    // This remains as a fallback for some browsers or older versions
                    // but redirect: true + callback_url will handle most cases.
                    try {
                        if (!response?.razorpay_payment_id || !response?.razorpay_signature) {
                            throw new Error('Invalid payment response from gateway');
                        }
                        const verifiedOrderPayload = {
                            paymentDetails: {
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            },
                            orderId: shadowOrderId,
                            customerDetails: {
                                name: formData.name,
                                email: formData.email,
                                mobile: formData.mobile
                            }
                        };

                        const placeOrderRes = await fetch('/api/orders/place-verified', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(verifiedOrderPayload)
                        });

                        const placeOrderData = await placeOrderRes.json();
                        if (placeOrderData.success) {
                            clearCart();
                            router.push(`/payment/success?orderId=${placeOrderData.orderId}`);
                        } else {
                            throw new Error('Order verification failed.');
                        }

                    } catch (verifyError: any) {
                        console.error("❌ Verification Error:", verifyError);
                        setError('Order creation failed. Please contact support.');
                    }
                },
                prefill: {
                    name: formData.name,
                    email: formData.email,
                    contact: formData.mobile,
                    ...(selectedPaymentMethod === 'upi' && upiId ? { vpa: upiId } : {}),
                    ...(selectedPaymentMethod === 'netbanking' && selectedBank ? { bank: selectedBank } : {}),
                    ...(selectedPaymentMethod === 'wallet' && selectedWallet ? { wallet: selectedWallet } : {}),
                },
                theme: {
                    color: "#4f46e5"
                },
                modal: {
                    ondismiss: async function () {
                        console.log("ℹ️ Payment modal dismissed by user");
                        setIsProcessing(false);
                        // Log user cancellation
                        if (shadowOrderId) {
                            fetch('/api/orders/update-drop-reason', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ orderId: shadowOrderId, reason: 'User dismissed Razorpay modal' })
                            }).catch(console.error);
                        }
                    }
                }
            };

            const rzp1 = new window.Razorpay(options);
            rzp1.on('payment.failed', async function (response: any) {
                console.error("❌ Payment Failed Event:", response.error);
                const errorMsg = `Payment Failed: ${response.error.description} (Code: ${response.error.code})`;
                setError(errorMsg);
                setIsProcessing(false);

                // Log payment failure
                if (shadowOrderId) {
                    fetch('/api/orders/update-drop-reason', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ orderId: shadowOrderId, reason: errorMsg })
                    }).catch(console.error);
                }
            });

            console.log("📢 Attempting to open Razorpay modal...");
            rzp1.open();
            // Clear loader once Razorpay modal has taken over
            setIsProcessing(false);

        } catch (err: any) {
            console.error('❌ Final Catch - Payment Error:', err);
            setError(err.message || 'Payment failed. Please try again.');
            alert("Error: " + (err.message || 'Failed to open payment gateway'));
            setIsProcessing(false);
        }
    };

    const isFormValid = () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return formData.name && emailRegex.test(formData.email) && formData.mobile && formData.mobile.length === 10 &&
            formData.street && formData.city && formData.state &&
            formData.zipCode && formData.zipCode.length === 6;
    };

    const finalSubtotal = discountResult?.discountedTotal || total;
    const grandTotal = (finalSubtotal || 0) + (shippingCost || 0);

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
                                            src={item.imageUrl || "https://images.unsplash.com/photo-1552066344-24632e509613?q=80&w=1000&auto=format&fit=crop"}
                                            alt={item.name}
                                            fill
                                            className="object-cover"
                                        // Loader handles optimization
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
                                                disabled={(() => {
                                                    let availableStock = item.stock;
                                                    if (item.selectedSize && item.sizes) {
                                                        const variant = item.sizes.find(s => s.size === item.selectedSize);
                                                        availableStock = variant ? variant.stock : 0;
                                                    }
                                                    return item.quantity >= availableStock;
                                                })()}
                                                className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
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
                                        Discounts Applied
                                    </span>
                                    <span>-₹{discountResult.totalDiscount.toFixed(2)}</span>
                                </div>
                                {discountResult.appliedDiscounts.map((discount, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-xs text-green-600 pl-6">
                                        <span className="flex items-center gap-1">
                                            <span className="px-1.5 py-0.5 bg-green-50 rounded text-[10px] font-medium">{discount.type}</span>
                                            {discount.description}
                                        </span>
                                        <span className="font-medium">-₹{discount.discount.toFixed(2)}</span>
                                    </div>
                                ))}
                            </>
                        )}
                        <div className="flex justify-between items-center text-slate-600">
                            <span>Shipping</span>
                            <span>₹{shippingCost.toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-amber-600 italic flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Shipping cost may vary based on your location
                        </p>
                        <div className="flex justify-between items-center text-lg font-bold text-slate-900 pt-2 border-t border-slate-100 mt-2">
                            <span>Total</span>
                            <span>₹{grandTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Customer Details Form */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-fit order-1 lg:order-2">
                    <h2 className="text-xl font-bold text-slate-900 mb-6">Customer Details</h2>

                    {/* Saved address selector */}
                    {savedAddresses.length > 0 && (
                        <div className="mb-6">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5" /> Saved Addresses
                            </p>
                            <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
                                {savedAddresses.map(addr => (
                                    <button
                                        key={addr.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedAddressId(addr.id);
                                            setFormData(prev => ({ ...prev, name: prev.name, mobile: prev.mobile, street: addr.street, city: addr.city, state: addr.state, country: addr.country, zipCode: addr.pincode }));
                                        }}
                                        className={`flex-shrink-0 text-left border-2 rounded-xl p-3 w-52 transition-all ${selectedAddressId === addr.id ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-bold uppercase text-slate-400">{addr.label}</span>
                                            {selectedAddressId === addr.id && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                                        </div>
                                        <p className="text-xs font-semibold text-slate-800 truncate">{addr.name}</p>
                                        <p className="text-[11px] text-slate-500 truncate">{addr.street}</p>
                                        <p className="text-[11px] text-slate-500">{addr.city} – {addr.pincode}</p>
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setSelectedAddressId(null)}
                                    className={`flex-shrink-0 text-left border-2 rounded-xl p-3 w-44 transition-all flex flex-col items-center justify-center gap-1 ${selectedAddressId === null ? 'border-indigo-600 bg-indigo-50' : 'border-dashed border-slate-300 hover:border-slate-400'}`}
                                >
                                    <MapPin className="w-5 h-5 text-slate-400" />
                                    <span className="text-xs font-bold text-slate-500">Use new address</span>
                                </button>
                            </div>
                        </div>
                    )}

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
                            <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed italic">
                                Please provide your complete and accurate address. This is the final delivery location for your parcel; modifications cannot be made once the order is placed.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Zip Code *</label>
                                <input
                                    type="text"
                                    name="zipCode"
                                    value={formData.zipCode}
                                    onChange={handleInputChange}
                                    required
                                    maxLength={6}
                                    pattern="\d{6}"
                                    placeholder="6-digit Pincode"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">City *</label>
                                <input type="text" name="city" value={formData.city} onChange={handleInputChange} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-amber-500 focus:border-amber-500" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">State *</label>
                                <input type="text" name="state" value={formData.state} onChange={handleInputChange} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-amber-500 focus:border-amber-500" />
                            </div>
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
                        </div>

                        {/* Save address checkbox — only for logged in users with no saved address selected */}
                        {customer && selectedAddressId === null && (
                            <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                <input type="checkbox" checked={saveAddress} onChange={e => setSaveAddress(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                <span className="text-sm text-slate-600">Save this address for future orders</span>
                            </label>
                        )}

                        <div className="mt-8">
                            {checkoutStep === 'details' ? (
                                <button
                                    type="button"
                                    onClick={() => isFormValid() && setCheckoutStep('payment-selection')}
                                    disabled={!isFormValid()}
                                    className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all ${!isFormValid()
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl'
                                        }`}
                                >
                                    Continue to Payment →
                                </button>
                            ) : (
                                <div className="space-y-5">
                                    <button
                                        type="button"
                                        onClick={() => setCheckoutStep('details')}
                                        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
                                    >
                                        ← Back to Details
                                    </button>

                                    {/* Section header */}
                                    <div>
                                        <p className="text-base font-bold text-slate-900">Choose Payment Method</p>
                                        <p className="text-xs text-slate-400 mt-0.5">All transactions are secure and encrypted</p>
                                    </div>

                                    {/* Payment method cards */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {([
                                            {
                                                id: 'upi' as const,
                                                label: 'UPI',
                                                sub: 'GPay · PhonePe · Paytm',
                                                Icon: Smartphone,
                                                iconBg: 'bg-violet-100',
                                                iconColor: 'text-violet-600',
                                            },
                                            {
                                                id: 'card' as const,
                                                label: 'Credit / Debit Card',
                                                sub: 'Visa · Mastercard · RuPay',
                                                Icon: CreditCard,
                                                iconBg: 'bg-blue-100',
                                                iconColor: 'text-blue-600',
                                            },
                                            {
                                                id: 'netbanking' as const,
                                                label: 'Net Banking',
                                                sub: 'SBI · HDFC · ICICI & more',
                                                Icon: Building2,
                                                iconBg: 'bg-amber-100',
                                                iconColor: 'text-amber-600',
                                            },
                                            {
                                                id: 'wallet' as const,
                                                label: 'Wallet',
                                                sub: 'Paytm · Mobikwik',
                                                Icon: Wallet,
                                                iconBg: 'bg-emerald-100',
                                                iconColor: 'text-emerald-600',
                                            },
                                        ] as const).map(({ id, label, sub, Icon, iconBg, iconColor }) => {
                                            const selected = selectedPaymentMethod === id;
                                            return (
                                                <button
                                                    key={id}
                                                    type="button"
                                                    onClick={() => setSelectedPaymentMethod(id)}
                                                    className={`relative text-left p-4 rounded-xl border-2 transition-all duration-150 ${
                                                        selected
                                                            ? 'border-indigo-600 bg-indigo-50 shadow-sm'
                                                            : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm'
                                                    }`}
                                                >
                                                    {/* Selected checkmark */}
                                                    {selected && (
                                                        <span className="absolute top-2.5 right-2.5 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                                                            <Check className="w-3 h-3 text-white stroke-[3]" />
                                                        </span>
                                                    )}
                                                    <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center mb-3`}>
                                                        <Icon className={`w-5 h-5 ${iconColor}`} />
                                                    </div>
                                                    <p className={`font-bold text-sm leading-tight ${selected ? 'text-indigo-700' : 'text-slate-800'}`}>{label}</p>
                                                    <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{sub}</p>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Method-specific sub-form */}
                                    {selectedPaymentMethod === 'upi' && (
                                        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-violet-700 mb-2">UPI ID</label>
                                            <input
                                                type="text"
                                                value={upiId}
                                                onChange={e => setUpiId(e.target.value)}
                                                placeholder="yourname@paytm / @gpay / @ybl"
                                                className="w-full border border-violet-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                                            />
                                            <p className="text-[11px] text-violet-500 mt-1.5">Optional — pre-fills your UPI ID in the payment screen</p>
                                        </div>
                                    )}

                                    {selectedPaymentMethod === 'card' && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                                            <CreditCard className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm font-semibold text-blue-800">Card details entered securely</p>
                                                <p className="text-xs text-blue-600 mt-0.5">Your card number, expiry and CVV are entered in Razorpay&apos;s encrypted payment screen — never stored on our servers.</p>
                                            </div>
                                        </div>
                                    )}

                                    {selectedPaymentMethod === 'netbanking' && (
                                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-amber-700 mb-2">Select Your Bank</label>
                                            <select
                                                value={selectedBank}
                                                onChange={e => setSelectedBank(e.target.value)}
                                                className="w-full border border-amber-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                                            >
                                                <option value="">-- Choose a bank --</option>
                                                <option value="SBIN">State Bank of India (SBI)</option>
                                                <option value="HDFC">HDFC Bank</option>
                                                <option value="ICIC">ICICI Bank</option>
                                                <option value="UTIB">Axis Bank</option>
                                                <option value="KKBK">Kotak Mahindra Bank</option>
                                                <option value="PUNB">Punjab National Bank</option>
                                                <option value="BKID">Bank of India</option>
                                                <option value="CNRB">Canara Bank</option>
                                            </select>
                                            <p className="text-[11px] text-amber-600 mt-1.5">You&apos;ll be redirected to your bank&apos;s secure login page</p>
                                        </div>
                                    )}

                                    {selectedPaymentMethod === 'wallet' && (
                                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-emerald-700 mb-2">Select Wallet</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {[
                                                    { id: 'paytm', label: 'Paytm' },
                                                    { id: 'mobikwik', label: 'Mobikwik' },
                                                    { id: 'freecharge', label: 'Freecharge' },
                                                ].map(w => (
                                                    <button
                                                        key={w.id}
                                                        type="button"
                                                        onClick={() => setSelectedWallet(w.id)}
                                                        className={`py-2 rounded-lg border-2 text-xs font-bold transition-all ${selectedWallet === w.id ? 'border-emerald-500 bg-emerald-100 text-emerald-700' : 'border-slate-200 text-slate-600 hover:border-emerald-300'}`}
                                                    >
                                                        {w.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Security badge */}
                                    <div className="flex items-center gap-2 py-2.5 px-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <ShieldCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                                        <p className="text-[11px] text-slate-500">Payments are <span className="font-semibold text-slate-700">100% secure</span> · Powered by <span className="font-semibold text-slate-700">Razorpay</span></p>
                                    </div>

                                    {/* Pay button */}
                                    <button
                                        type="button"
                                        onClick={handlePayment}
                                        disabled={!selectedPaymentMethod || isProcessing}
                                        className={`w-full py-4 px-6 rounded-xl font-bold text-base tracking-wide transition-all flex items-center justify-center gap-2 ${
                                            !selectedPaymentMethod || isProcessing
                                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 hover:shadow-xl active:scale-[0.99]'
                                        }`}
                                    >
                                        {isProcessing ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Lock className="w-4 h-4" />
                                                Pay ₹{grandTotal.toFixed(2)}
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
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
