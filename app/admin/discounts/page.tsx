import { getDiscounts, getUniqueCategories } from '@/lib/db';
import { addDiscount, removeDiscount } from '@/lib/actions';
import { Trash2, Plus, Tag } from 'lucide-react';
// import { PRODUCT_CATEGORIES } from '@/lib/constants'; // No longer needed

export const dynamic = 'force-dynamic';

export default async function DiscountsPage() {
    const discounts = await getDiscounts();
    const categories = await getUniqueCategories();

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
                                Create Discount
                            </button>
                        </form>
                    </div>
                </div>

                {/* Discount List */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Active Discounts</h2>
                    {discounts.length === 0 ? (
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 text-center">
                            <Tag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500">No active discounts found.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {discounts.map(discount => (
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
                                        <p className="text-xs text-slate-500 mt-1">
                                            Bundle Offer
                                        </p>
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
            </div>
        </div>
    );
}
