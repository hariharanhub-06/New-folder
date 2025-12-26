"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Save, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { getFullCategories, saveCategory, deleteCategory, uploadImage } from "@/lib/api";

export default function AdminCategories() {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ name: "", image_url: "", is_active: true });
    const [isAdding, setIsAdding] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        loadCategories();
    }, []);

    async function loadCategories() {
        setLoading(true);
        try {
            const data = await getFullCategories();
            setCategories(data);
        } catch (err) {
            console.error("Failed to load categories", err);
        } finally {
            setLoading(false);
        }
    }

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>, isForNew: boolean = false) {
        if (!e.target.files?.[0]) return;
        setUploading(true);
        try {
            const res = await uploadImage(e.target.files[0]);
            if (res.success) {
                setEditForm(prev => ({ ...prev, image_url: res.url }));
            }
        } catch (err) {
            alert("Upload failed");
        } finally {
            setUploading(false);
        }
    }

    async function handleSave() {
        if (!editForm.name) return;
        setLoading(true);
        try {
            await saveCategory({
                id: editingId || undefined,
                ...editForm
            });
            setEditingId(null);
            setIsAdding(false);
            setEditForm({ name: "", image_url: "", is_active: true });
            await loadCategories();
        } catch (err) {
            alert("Save failed");
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure? This won't delete products, but will remove the category from the list.")) return;
        setLoading(true);
        try {
            await deleteCategory(id);
            await loadCategories();
        } catch (err) {
            alert("Delete failed");
        } finally {
            setLoading(false);
        }
    }

    function startEdit(cat: any) {
        setEditingId(cat.id);
        setEditForm({ name: cat.name, image_url: cat.image_url || "", is_active: cat.is_active });
        setIsAdding(false);
    }

    return (
        <div className="p-8 max-w-6xl mx-auto font-jost">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter italic">Manage <span className="text-brand-red">Categories</span></h1>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-2">Control how drops are organized</p>
                </div>
                {!isAdding && !editingId && (
                    <button
                        onClick={() => { setIsAdding(true); setEditForm({ name: "", image_url: "", is_active: true }); }}
                        className="flex items-center gap-2 bg-brand-red text-white px-6 py-3 font-bold uppercase tracking-widest text-xs hover:scale-105 transition-transform"
                    >
                        <Plus className="w-4 h-4" /> Add Category
                    </button>
                )}
            </div>

            {(isAdding || editingId) && (
                <div className="bg-white border-4 border-black p-8 mb-12 shadow-[12px_12px_0px_rgba(0,0,0,1)] animate-in fade-in zoom-in-95 duration-200">
                    <h2 className="text-xl font-bold uppercase mb-8 border-b-2 border-black pb-2">
                        {isAdding ? "Drop New Category" : "Edit Category"}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-2">Category Name</label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-black outline-none focus:bg-gray-50 font-bold"
                                    placeholder="e.g. Hoodies"
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={editForm.is_active}
                                    onChange={e => setEditForm({ ...editForm, is_active: e.target.checked })}
                                    className="w-6 h-6 accent-brand-red"
                                />
                                <label htmlFor="isActive" className="text-sm font-bold uppercase tracking-widest cursor-pointer">Live On Shop</label>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-2">Category Image (Vertical Advised)</label>
                            <div className="relative aspect-[3/4] w-48 mx-auto border-4 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden bg-gray-50 hover:border-brand-red transition-colors group">
                                {uploading ? (
                                    <Loader2 className="w-8 h-8 animate-spin text-brand-red" />
                                ) : editForm.image_url ? (
                                    <>
                                        <img src={editForm.image_url} alt={editForm.name || "Category Preview"} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <p className="text-[10px] text-white font-bold uppercase">Change Image</p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center text-gray-400">
                                        <ImageIcon className="w-10 h-10 mb-2" />
                                        <p className="text-[8px] font-bold uppercase text-center px-4 tracking-[0.2em]">Click to upload category card</p>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    onChange={e => handleUpload(e)}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 mt-12 pt-8 border-t-2 border-black">
                        <button
                            onClick={handleSave}
                            disabled={loading || uploading}
                            className="flex-1 bg-black text-white py-4 font-bold uppercase tracking-widest text-sm hover:bg-brand-red transition-colors disabled:opacity-50"
                        >
                            {loading ? "Processing..." : "Save Category"}
                        </button>
                        <button
                            onClick={() => { setEditingId(null); setIsAdding(false); }}
                            className="px-10 border-2 border-black py-4 font-bold uppercase tracking-widest text-sm hover:bg-gray-100 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {categories.map((cat) => (
                    <div key={cat.id} className="bg-white border-2 border-black p-4 flex flex-col group hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-all">
                        <div className="aspect-[3/4] bg-gray-100 relative mb-4 overflow-hidden border-2 border-black">
                            {cat.image_url ? (
                                <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    <ImageIcon className="w-12 h-12" />
                                </div>
                            )}
                            {!cat.is_active && (
                                <div className="absolute top-2 right-2 bg-black text-white text-[8px] font-bold px-2 py-1 uppercase tracking-widest">Hidden</div>
                            )}
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-black uppercase tracking-tighter italic">{cat.name}</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID: {cat.id}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => startEdit(cat)} className="p-2 border border-black hover:bg-black hover:text-white transition-colors">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(cat.id)} className="p-2 border border-brand-red text-brand-red hover:bg-brand-red hover:text-white transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {categories.length === 0 && !loading && (
                <div className="text-center py-32 border-4 border-dashed border-gray-200">
                    <p className="text-lg font-bold text-gray-400 uppercase tracking-widest italic">No categories drop found</p>
                </div>
            )}
        </div>
    );
}
