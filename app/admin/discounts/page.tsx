'use client';

import { useState, useEffect } from 'react';
import { Trash2, Plus, Tag, Percent } from 'lucide-react';
import { Product, Discount } from '@/lib/types';

export default function DiscountsPage() {
    const [discountType, setDiscountType] = useState<'bundle' | 'percentage'>('bundle');
    const [targetType, setTargetType] = useState<'category' | 'product'>('category');
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [discounts, setDiscounts] = useState<Discount[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const productsRes = await fetch('/api/products?limit=1000');
            const productsData = await productsRes.json();
            setProducts(productsData.products || []);
            const uniqueCategories = Array.from(new Set((productsData.products || []).map((p: Product) => p.category).filter(Boolean))) as string[];
            setCategories(uniqueCategories);

            const discountsRes = await fetch('/api/discounts');
            const discountsData = await discountsRes.json();
            setDiscounts(discountsData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);

        const discountData: any = {
            discountType,
            targetType,
            active: true
        };

        if (targetType === 'category') {
            discountData.category = formData.get('category');
        } else {
            discountData.productId = formData.get('productId');
        }

        if (discountType === 'bundle') {
            discountData.quantity = parseInt(formData.get('quantity') as string);
            discountData.price = parseFloat(formData.get('price') as string);
        } else {
            discountData.percentage = parseInt(formData.get('percentage') as string);
        }

        try {
            const res = await fetch('/api/discounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(discountData)
            });

            if (res.ok) {
                loadData();
                form.reset();
                alert('Discount created successfully!');
            } else {
                const errorData = await res.json();
                console.error('Error response:', errorData);
                alert(`Failed to create discount: ${errorData.error || errorData.details || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error creating discount:', error);
            alert(`Network error: ${error}`);
        }
    }

    async function handleRemove(id: string) {
        try {
            await fetch(`/api/discounts?id=${id}`, { method: 'DELETE' });
            loadData();
        } catch (error) {
            console.error('Error removing discount:', error);
        }
    }

    if (loading) {
        return <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Discount Management</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Add New Discount Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 sticky top-24">
                        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                            <Plus className="w-5 h-5 mr-2 text-indigo-600" />
                            Add New Discount
                        </h2>

                        {/* Type Selectors */}
                        <div className="space-y-3 mb-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-2">Discount Type</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setDiscountType('bundle')}
                                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${discountType === 'bundle'
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        <Tag className="w-4 h-4 inline mr-1" />
                                        Bundle
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDiscountType('percentage')}
                                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${discountType === 'percentage'
                                            ? 'bg-green-600 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        <Percent className="w-4 h-4 inline mr-1" />
                                        Percentage
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-2">Apply To</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setTargetType('category')}
                                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${targetType === 'category'
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        Category
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTargetType('product')}
                                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${targetType === 'product'
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        Product
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Dynamic Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Target Selection */}
                            {targetType === 'category' ? (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                    <select name="category" required className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                                        <option value="">Select Category</option>
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Product</label>
                                    <select name="productId" required className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                                        <option value="">Select Product</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} - ₹{p.price}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Bundle Fields */}
                            {discountType === 'bundle' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                                        <input type="number" name="quantity" min="2" required className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" placeholder="e.g., 3" />
                                        <p className="text-xs text-slate-500 mt-1">Buy this many to get bundle price</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Bundle Price (₹)</label>
                                        <input type="number" name="price" min="0" step="0.01" required className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" placeholder="e.g., 500" />
                                        <p className="text-xs text-slate-500 mt-1">Total price for the bundle</p>
                                    </div>
                                </>
                            )}

                            {/* Percentage Fields */}
                            {discountType === 'percentage' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Discount (%)</label>
                                    <input type="number" name="percentage" min="1" max="100" required className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" placeholder="e.g., 20" />
                                    <p className="text-xs text-slate-500 mt-1">Percentage off regular price</p>
                                </div>
                            )}

                            <button type="submit" className={`w-full text-white px-4 py-2 rounded-md hover:opacity-90 transition-colors flex items-center justify-center ${discountType === 'bundle' ? 'bg-indigo-600' : 'bg-green-600'
                                }`}>
                                {discountType === 'bundle' ? <Tag className="w-4 h-4 mr-2" /> : <Percent className="w-4 h-4 mr-2" />}
                                Create Discount
                            </button>
                        </form>
                    </div>
                </div>

                {/* Discount Lists */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-lg font-bold text-slate-900">Active Discounts</h2>

                    {discounts.length === 0 ? (
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 text-center">
                            <Tag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500">No active discounts.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {discounts.map(discount => {
                                const product = discount.productId ? products.find(p => p.id === discount.productId) : null;
                                const label = discount.targetType === 'category' ? discount.category : product?.name || 'Unknown';

                                return (
                                    <div key={discount.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex justify-between items-start">
                                        <div className="flex-1">
                                            <p className="text-slate-900 font-bold mb-2">{label}</p>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`px-2 py-1 text-xs font-medium rounded ${discount.discountType === 'bundle'
                                                    ? 'bg-indigo-50 text-indigo-700'
                                                    : 'bg-green-50 text-green-700'
                                                    }`}>
                                                    {discount.discountType === 'bundle' ? 'Bundle' : `${discount.percentage}% OFF`}
                                                </span>
                                                <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded">
                                                    {discount.targetType}
                                                </span>
                                            </div>

                                            {discount.discountType === 'bundle' ? (
                                                <p className="text-slate-700 text-sm">
                                                    Buy <span className="font-bold text-indigo-600">{discount.quantity}</span> for <span className="font-bold text-green-600">₹{discount.price}</span>
                                                </p>
                                            ) : (
                                                <p className="text-slate-700 text-sm">
                                                    <span className="font-bold text-green-600">{discount.percentage}% discount</span> on all items
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleRemove(discount.id)}
                                            className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
