"use client";

import { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, Star, Edit2, X, Check } from 'lucide-react';

interface Address {
    id: string; label: string; name: string; mobile: string;
    street: string; city: string; state: string; country: string; pincode: string; is_default: boolean;
}

const emptyForm = { label: 'Home', name: '', mobile: '', street: '', city: '', state: '', country: 'India', pincode: '' };

export default function AddressManager() {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    async function fetchAddresses() {
        const res = await fetch('/api/customer/addresses');
        if (res.ok) { const data = await res.json(); setAddresses(data.addresses); }
        setLoading(false);
    }

    useEffect(() => { fetchAddresses(); }, []);

    function openAdd() { setEditId(null); setForm(emptyForm); setError(''); setShowForm(true); }
    function openEdit(addr: Address) {
        setEditId(addr.id);
        setForm({ label: addr.label, name: addr.name, mobile: addr.mobile, street: addr.street, city: addr.city, state: addr.state, country: addr.country, pincode: addr.pincode });
        setError(''); setShowForm(true);
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true); setError('');
        try {
            const url = editId ? `/api/customer/addresses/${editId}` : '/api/customer/addresses';
            const method = editId ? 'PUT' : 'POST';
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
            if (!res.ok) { const d = await res.json(); setError(d.error || 'Failed to save'); return; }
            setShowForm(false); fetchAddresses();
        } catch { setError('Something went wrong'); }
        finally { setSaving(false); }
    }

    async function handleDelete(id: string) {
        if (!confirm('Delete this address?')) return;
        await fetch(`/api/customer/addresses/${id}`, { method: 'DELETE' });
        fetchAddresses();
    }

    async function handleSetDefault(id: string) {
        await fetch(`/api/customer/addresses/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ setDefault: true }) });
        fetchAddresses();
    }

    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">Saved Addresses</h2>
                </div>
                <button onClick={openAdd} className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 hover:text-indigo-800 transition-colors">
                    <Plus className="w-4 h-4" /> Add New
                </button>
            </div>

            {loading ? (
                <p className="text-sm text-gray-400 text-center py-4">Loading...</p>
            ) : addresses.length === 0 && !showForm ? (
                <div className="text-center py-8">
                    <MapPin className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">No saved addresses yet.</p>
                    <button onClick={openAdd} className="mt-3 text-sm text-indigo-600 font-bold hover:underline">+ Add your first address</button>
                </div>
            ) : (
                <div className="space-y-3">
                    {addresses.map(addr => (
                        <div key={addr.id} className={`relative border rounded-xl p-4 ${addr.is_default ? 'border-indigo-300 bg-indigo-50/40' : 'border-gray-200'}`}>
                            {addr.is_default && (
                                <span className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                                    <Star className="w-3 h-3 fill-indigo-600" /> Default
                                </span>
                            )}
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">{addr.label}</p>
                            <p className="font-semibold text-sm text-gray-900">{addr.name} · {addr.mobile}</p>
                            <p className="text-sm text-gray-600 mt-0.5">{addr.street}, {addr.city}, {addr.state} – {addr.pincode}</p>
                            <div className="flex items-center gap-3 mt-3">
                                {!addr.is_default && (
                                    <button onClick={() => handleSetDefault(addr.id)} className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1">
                                        <Check className="w-3 h-3" /> Set Default
                                    </button>
                                )}
                                <button onClick={() => openEdit(addr)} className="text-xs text-gray-500 hover:text-gray-800 font-bold flex items-center gap-1">
                                    <Edit2 className="w-3 h-3" /> Edit
                                </button>
                                <button onClick={() => handleDelete(addr.id)} className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1">
                                    <Trash2 className="w-3 h-3" /> Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showForm && (
                <div className="mt-4 border border-indigo-200 rounded-xl p-5 bg-indigo-50/30">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-bold uppercase tracking-wider text-gray-700">{editId ? 'Edit Address' : 'New Address'}</p>
                        <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-700"><X className="w-4 h-4" /></button>
                    </div>
                    <form onSubmit={handleSave} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Label</label>
                                <select value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                    <option>Home</option><option>Office</option><option>Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Name *</label>
                                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Mobile *</label>
                            <input value={form.mobile} onChange={e => setForm(p => ({ ...p, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Street Address *</label>
                            <input value={form.street} onChange={e => setForm(p => ({ ...p, street: e.target.value }))} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Pincode *</label>
                                <input value={form.pincode} onChange={e => setForm(p => ({ ...p, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))} required maxLength={6} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">City *</label>
                                <input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">State *</label>
                            <input value={form.state} onChange={e => setForm(p => ({ ...p, state: e.target.value }))} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        {error && <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}
                        <div className="flex gap-3 pt-1">
                            <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-indigo-700 disabled:opacity-60">
                                {saving ? 'Saving...' : 'Save Address'}
                            </button>
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
