"use client";

import { useState, useEffect } from 'react';
import { Upload, X, Star, Image as ImageIcon, Loader2, Plus } from 'lucide-react';
import CategorySelector from './CategorySelector';
import { addProduct } from '@/lib/actions';

const VISIBILITY_HEADERS = [
    { id: 'new-arrivals', label: 'New Arrival' },
    { id: 'trending-now', label: 'Trending Now' },
    { id: 'best-offers', label: 'Best Offers' },
    { id: 'formal-shirts', label: 'Formal Shirts' },
    { id: 'baggy-shirts', label: 'Baggy Shirts' },
    { id: 'premium-shirts', label: 'Premium Shirts' },
    { id: 'bottoms', label: 'Bottoms' },
    { id: 'trousers', label: 'Trousers' },
    { id: 'hoodies', label: 'Hoodies' },
    { id: 't-shirts', label: 'T-Shirts' },
    { id: 'accessories', label: 'Accessories' },
];

export default function AddProductForm({ onSuccess, onCancel }: { onSuccess: () => void, onCancel: () => void }) {
    const [imageOption, setImageOption] = useState<'url' | 'upload'>('url');
    const [images, setImages] = useState<string[]>([]);
    const [mainImageIndex, setMainImageIndex] = useState<number>(0);
    const [currentInput, setCurrentInput] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [sizes, setSizes] = useState<{ size: string; stock: number }[]>([{ size: '', stock: 0 }]);
    const [weightValue, setWeightValue] = useState<string>('');
    const [weightUnit, setWeightUnit] = useState<'grams' | 'kg'>('grams');
    const [category, setCategory] = useState<string>('Shirt');
    const [isOffer, setIsOffer] = useState(false);
    const [isTrending, setIsTrending] = useState(false);
    const [isNewArrival, setIsNewArrival] = useState(false);
    const [visibilityTags, setVisibilityTags] = useState<string[]>([]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsProcessing(true);

        try {
            const imageCompression = (await import('browser-image-compression')).default;
            const heic2any = (await import('heic2any')).default;

            const processedImages: string[] = [];

            for (let i = 0; i < files.length; i++) {
                let file = files[i];

                if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic')) {
                    try {
                        const convertedBlob = await heic2any({
                            blob: file,
                            toType: 'image/jpeg',
                            quality: 0.8
                        });
                        const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
                        file = new File([blob], file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg' });
                    } catch (e) {
                        console.error('Error converting HEIC:', e);
                        continue;
                    }
                }

                const options = {
                    maxSizeMB: 0.3,
                    maxWidthOrHeight: 1920,
                    useWebWorker: true,
                    initialQuality: 0.75,
                    fileType: 'image/webp'
                };

                try {
                    const compressedFile = await imageCompression(file, options);
                    const formData = new FormData();
                    formData.append('file', compressedFile);

                    const res = await fetch('/api/upload-image', {
                        method: 'POST',
                        body: formData
                    });

                    if (!res.ok) throw new Error('Upload failed');

                    const data = await res.json();
                    if (data.success && data.url) {
                        processedImages.push(data.url);
                    }
                } catch (error) {
                    console.error('Error uploading image:', error);
                }
            }

            setImages(prev => [...prev, ...processedImages]);
        } catch (error) {
            console.error('Error processing images:', error);
            alert('Error processing images. Please try again.');
        } finally {
            setIsProcessing(false);
            e.target.value = '';
        }
    };

    const handleAddUrl = () => {
        if (currentInput.trim()) {
            setImages(prev => [...prev, currentInput.trim()]);
            setCurrentInput('');
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        if (index === mainImageIndex) {
            setMainImageIndex(0);
        } else if (index < mainImageIndex) {
            setMainImageIndex(prev => prev - 1);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (images.length === 0) {
            alert('Please add at least one image');
            return;
        }

        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);

        // Prepare data for server action
        formData.set('imageUrl', images[mainImageIndex]);
        formData.set('images', JSON.stringify(images));

        const validSizes = sizes.filter(s => s.size.trim() !== '');
        if (validSizes.length > 0) {
            formData.set('sizes', JSON.stringify(validSizes));
            const totalStock = validSizes.reduce((sum, s) => sum + s.stock, 0);
            formData.set('stock', totalStock.toString());
        }

        const weightInGrams = weightValue ?
            (weightUnit === 'kg' ? parseFloat(weightValue) * 1000 : parseFloat(weightValue))
            : 750;
        formData.set('weight', Math.round(weightInGrams).toString());
        formData.set('isOffer', isOffer.toString());
        formData.set('isTrending', isTrending.toString());
        formData.set('isNewArrival', isNewArrival.toString());
        formData.set('visibilityTags', JSON.stringify(visibilityTags));
        formData.set('category', category);

        try {
            // We pass null for redirectTo to prevent server-side redirect, handling it here instead
            await addProduct(formData, undefined);
            onSuccess();
        } catch (error) {
            // Check for next.js redirect (which is actually success for us)
            if ((error as any)?.digest?.startsWith('NEXT_REDIRECT')) {
                onSuccess();
                return;
            }
            console.error('Error adding product:', error);
            alert('Failed to add product');
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 font-bold uppercase tracking-tight">Product Name</label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            required
                            className="mt-1 block w-full border-gray-200 shadow-sm focus:border-black focus:ring-0 sm:text-sm border p-3"
                        />
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 font-bold uppercase tracking-tight">Description</label>
                        <textarea
                            name="description"
                            id="description"
                            rows={3}
                            required
                            className="mt-1 block w-full border-gray-200 shadow-sm focus:border-black focus:ring-0 sm:text-sm border p-3"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="price" className="block text-sm font-medium text-gray-700 font-bold uppercase tracking-tight">Price (₹)</label>
                            <input
                                type="number"
                                name="price"
                                id="price"
                                step="0.01"
                                required
                                className="mt-1 block w-full border-gray-200 shadow-sm focus:border-black focus:ring-0 sm:text-sm border p-3"
                            />
                        </div>
                        <div>
                            <CategorySelector
                                currentCategory={category}
                                onCategoryChange={setCategory}
                            />
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-none border border-slate-200">
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest">Stock & Sizes</label>
                            <button
                                type="button"
                                onClick={() => setSizes([...sizes, { size: '', stock: 0 }])}
                                className="text-[10px] font-bold text-black hover:text-brand-red flex items-center gap-1 uppercase tracking-widest"
                            >
                                <Plus className="w-3 h-3" /> Add Variant
                            </button>
                        </div>
                        <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
                            {sizes.map((item, index) => (
                                <div key={index} className="flex gap-2 items-start">
                                    <input
                                        type="text"
                                        placeholder="Size"
                                        value={item.size}
                                        onChange={(e) => {
                                            const newSizes = [...sizes];
                                            newSizes[index].size = e.target.value;
                                            setSizes(newSizes);
                                        }}
                                        className="flex-1 border-gray-200 shadow-sm focus:border-black focus:ring-0 text-xs border p-2"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Qty"
                                        value={item.stock || ''}
                                        min="0"
                                        onChange={(e) => {
                                            const newSizes = [...sizes];
                                            newSizes[index].stock = parseInt(e.target.value) || 0;
                                            setSizes(newSizes);
                                        }}
                                        className="w-20 border-gray-200 shadow-sm focus:border-black focus:ring-0 text-xs border p-2"
                                    />
                                    {sizes.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => setSizes(sizes.filter((_, i) => i !== index))}
                                            className="p-2 text-gray-400 hover:text-brand-red"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="weight" className="block text-sm font-medium text-gray-700 font-bold uppercase tracking-tight">Weight</label>
                        <div className="mt-1 flex gap-2">
                            <input
                                type="number"
                                name="weight_value"
                                id="weight"
                                step="0.01"
                                min="0"
                                value={weightValue}
                                onChange={(e) => setWeightValue(e.target.value)}
                                placeholder="Value"
                                required
                                className="flex-1 border-gray-200 shadow-sm focus:border-black focus:ring-0 text-xs border p-3"
                            />
                            <select
                                name="weight_unit"
                                value={weightUnit}
                                onChange={(e) => setWeightUnit(e.target.value as 'grams' | 'kg')}
                                className="w-24 border-gray-200 shadow-sm focus:border-black focus:ring-0 text-xs border p-3"
                            >
                                <option value="grams">Grams</option>
                                <option value="kg">Kg</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-50 p-4 border border-slate-200 space-y-4">
                        <div className="flex flex-wrap gap-4">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={isOffer}
                                    onChange={(e) => setIsOffer(e.target.checked)}
                                    className="w-4 h-4 text-brand-red border-gray-300 rounded focus:ring-0"
                                />
                                <span className="text-xs font-bold uppercase tracking-tight group-hover:text-brand-red transition-colors">Hot Offer</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={isTrending}
                                    onChange={(e) => setIsTrending(e.target.checked)}
                                    className="w-4 h-4 text-brand-red border-gray-300 rounded focus:ring-0"
                                />
                                <span className="text-xs font-bold uppercase tracking-tight group-hover:text-brand-red transition-colors">Trending</span>
                            </label>
                        </div>

                        <div>
                            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Navigation Tags</span>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 max-h-[100px] overflow-y-auto">
                                {VISIBILITY_HEADERS.map(header => (
                                    <label key={header.id} className="flex items-center gap-2 cursor-pointer py-1">
                                        <input
                                            type="checkbox"
                                            checked={visibilityTags.includes(header.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) setVisibilityTags(prev => [...prev, header.id]);
                                                else setVisibilityTags(prev => prev.filter(t => t !== header.id));
                                            }}
                                            className="w-3.5 h-3.5 text-black border-gray-300 rounded focus:ring-0"
                                        />
                                        <span className="text-[11px] text-gray-600">{header.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="block text-sm font-bold text-gray-700 uppercase tracking-tight">Images ({images.length}/10)</label>
                        <div className="bg-gray-50 border-2 border-dashed border-gray-200 p-4 relative min-h-[100px] flex flex-col justify-center">
                            {imageOption === 'url' ? (
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        value={currentInput}
                                        onChange={(e) => setCurrentInput(e.target.value)}
                                        placeholder="Image URL"
                                        className="flex-1 border-gray-200 text-xs border p-2"
                                    />
                                    <button type="button" onClick={handleAddUrl} className="bg-black text-white px-3 py-1 text-xs uppercase font-bold">Add</button>
                                </div>
                            ) : (
                                <label className={`cursor-pointer text-center ${isProcessing ? 'opacity-50' : ''}`}>
                                    <Upload className="w-6 h-6 mx-auto mb-1 text-gray-400" />
                                    <span className="text-[10px] font-bold uppercase text-gray-500">Upload Files</span>
                                    <input type="file" className="hidden" multiple accept="image/*,.heic,.heif" onChange={handleImageUpload} disabled={isProcessing} />
                                </label>
                            )}
                            <div className="flex justify-center gap-4 mt-2">
                                <button type="button" onClick={() => setImageOption('url')} className={`text-[10px] font-bold uppercase transition-colors ${imageOption === 'url' ? 'text-black underline' : 'text-gray-400'}`}>URL</button>
                                <button type="button" onClick={() => setImageOption('upload')} className={`text-[10px] font-bold uppercase transition-colors ${imageOption === 'upload' ? 'text-black underline' : 'text-gray-400'}`}>File</button>
                            </div>
                        </div>

                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {images.map((img, index) => (
                                <div key={index} className={`flex-shrink-0 relative w-16 h-16 border-2 ${index === mainImageIndex ? 'border-black' : 'border-transparent'}`}>
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                        <button type="button" onClick={() => setMainImageIndex(index)} className="p-1 bg-white rounded-full"><Star className={`w-2.5 h-2.5 ${index === mainImageIndex ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} /></button>
                                        <button type="button" onClick={() => removeImage(index)} className="p-1 bg-white rounded-full"><X className="w-2.5 h-2.5 text-red-500" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-8 py-3 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black border border-transparent hover:border-gray-200 transition-all"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting || isProcessing || images.length === 0}
                    className="px-10 py-3 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-brand-red transition-all disabled:opacity-50 flex items-center gap-2"
                >
                    {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save Product'}
                </button>
            </div>
        </form>
    );
}
