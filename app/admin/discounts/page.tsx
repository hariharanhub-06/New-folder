'use client';

import { useState, useEffect } from 'react';
import { Trash2, Plus, Tag, Percent } from 'lucide-react';
import { Product, Discount, ProductDiscount } from '@/lib/types';
import { addDiscount, removeDiscount } from '@/lib/actions';

export default function DiscountsPage() {
    const [discountType, setDiscountType] = useState<'category' | 'product'>('category');
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [categoryDiscounts, setCategoryDiscounts] = useState<Discount[]>([]);
    const [productDiscounts, setProductDiscounts] = useState<(ProductDiscount & { productName?: string })[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            // Fetch products
            const productsRes = await fetch('/api/products');
            const productsData = await productsRes.json();
            setProducts(productsData);

            // Get unique categories
            const uniqueCategories = Array.from(new Set(productsData.map((p: Product) => p.category).filter(Boolean))) as string[];
            setCategories(uniqueCategories);

            // Fetch category discounts
            const discountsRes = await fetch('/api/discounts');
            const discountsData = await discountsRes.json();
            setCategoryDiscounts(discountsData);

            // Fetch product discounts
            const productDiscountsRes = await fetch('/api/product-discounts');
            const productDiscountsData = await productDiscountsRes.json();
            // Map product names
            const enriched = productDiscountsData.map((pd: ProductDiscount) => ({
                ...pd,
                productName: productsData.find((p: Product) => p.id === pd.productId)?.name
            }));
            setProductDiscounts(enriched);
        } catch (error) {
            console.error('Error loading discounts:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleProductDiscountSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        try {
            const res = await fetch('/api/product-discounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: formData.get('productId'),
                    discountPercentage: parseInt(formData.get('discountPercentage') as string)
                })
            });

            if (res.ok) {
                loadData();
                e.currentTarget.reset();
            }
        } catch (error) {
            console.error('Error creating product discount:', error);
        }
    }

    async function handleRemoveProductDiscount(id: string) {
        try {
            await fetch(`/api/product-discounts?id=${id}`, { method: 'DELETE' });
            loadData();
        } catch (error) {
            console.error('Error removing product discount:', error);
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

                        {/* Discount Type Selector */}
                        <div className="mb-4 flex gap-2">
                            <button
                                type="button"
                                onClick={() => setDiscountType('category')}
                                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${discountType === 'category'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                <Tag className="w-4 h-4 inline mr-1" />
                                Category Bundle
                            </button>
                            <button
                                type="button"
                                onClick={() => setDiscountType('product')}
                                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${discountType === 'product'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                <Percent className="w-4 h-4 inline mr-1" />
                                Product %
                            </button>
                        </div>

                        {/* Category Bundle Form */}
                        {discountType === 'category' && (
                            <form action={addDiscount} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                    <select name="category" required className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                                        <option value="">Select Category</option>
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Bundle Quantity</label>
                                    <input type="number" name="quantity" min="1" required className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" placeholder="e.g., 2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Bundle Price (₹)</label>
                                    <input type="number" name="price" min="0" step="0.01" required className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" placeholder="e.g., 1000" />
                                </div>
                                <button type="submit" className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center">
                                    <Tag className="w-4 h-4 mr-2" />
                                    Create Bundle Discount
                                </button>
                            </form>
                        )}

                        {/* Product Percentage Form */}
                        {discountType === 'product' && (
                            <form onSubmit={handleProductDiscountSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Product</label>
                                    <select name="productId" required className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                                        <option value="">Select Product</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} - ₹{p.price}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Discount Percentage (%)</label>
                                    <input type="number" name="discountPercentage" min="1" max="100" required className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" placeholder="e.g., 20" />
                                </div>
                                <button type="submit" className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center">
                                    <Percent className="w-4 h-4 mr-2" />
                                    Create Product Discount
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                {/* Discount Lists */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Category Bundle Discounts */}
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 mb-4">Active Category Bundles</h2>
                        {categoryDiscounts.length === 0 ? (
                            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 text-center">
                                <Tag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500">No active category bundles.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {categoryDiscounts.map(discount => (
                                    <div key={discount.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full uppercase">
                                                    {discount.category}
                                                </span>
                                            </div>
                                            <p className="text-slate-900 font-medium">
                                                Buy <span className="font-bold">{discount.quantity}</span> for <span className="font-bold text-green-600">₹{discount.price}</span>
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">Bundle Offer</p>
                                        </div>
                                        <form action={removeDiscount.bind(null, discount.id)}>
                                            <button type="submit" className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </form>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Discounts */}
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 mb-4">Active Product Discounts</h2>
                        {productDiscounts.length === 0 ? (
                            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 text-center">
                                <Percent className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500">No active product discounts.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {productDiscounts.map(discount => (
                                    <div key={discount.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex justify-between items-start">
                                        <div className="flex-1">
                                            <p className="text-slate-900 font-bold mb-1">{discount.productName}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-1 bg-green-50 text-green-700 text-sm font-bold rounded">
                                                    {discount.discountPercentage}% OFF
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveProductDiscount(discount.id)}
                                            className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
