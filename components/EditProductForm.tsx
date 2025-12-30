"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { editProduct } from '@/lib/actions';
import { Upload, X, Star, Image as ImageIcon, Loader2, Plus } from 'lucide-react';
import { Product } from '@/lib/types';
import CategorySelector from '@/components/CategorySelector';

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

export default function EditProductForm({
    product,
    initialPage = '1',
    onSuccess
}: {
    product: Product,
    initialPage?: string,
    onSuccess?: () => void
}) {
    const [imageOption, setImageOption] = useState<'url' | 'upload'>('url');
    // Initialize images from product.images if available, otherwise fallback to [product.imageUrl]
    const [images, setImages] = useState<string[]>(product.images && product.images.length > 0 ? product.images : [product.imageUrl]);
    // Find index of main image, default to 0
    const [mainImageIndex, setMainImageIndex] = useState<number>(
        product.images ? product.images.indexOf(product.imageUrl) > -1 ? product.images.indexOf(product.imageUrl) : 0 : 0
    );
    const [currentInput, setCurrentInput] = useState<string>('');
    const [sizes, setSizes] = useState<{ size: string; stock: number }[]>(
        product.sizes && product.sizes.length > 0
            ? product.sizes.map(s => ({ size: s.size, stock: s.stock }))
            : [{ size: product.size || '', stock: product.stock }]
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Initialize weight: if product has weight, determine unit based on value
    const initialWeight = product.weight || 750;
    const initialUnit: 'grams' | 'kg' = initialWeight >= 1000 ? 'kg' : 'grams';
    const initialValue = initialUnit === 'kg' ? (initialWeight / 1000).toString() : initialWeight.toString();

    const [weightValue, setWeightValue] = useState<string>(initialValue);
    const [weightUnit, setWeightUnit] = useState<'grams' | 'kg'>(initialUnit);
    // Use simple category state
    const [category, setCategory] = useState<string>(product.category || 'Shirt');
    const [isOffer, setIsOffer] = useState(product.isOffer || false);
    const [isTrending, setIsTrending] = useState(product.isTrending || false);
    const [isNewArrival, setIsNewArrival] = useState(product.isNewArrival || false);
    const [visibilityTags, setVisibilityTags] = useState<string[]>(product.visibilityTags || []);

    // No need for useEffect fetching here as CategorySelector handles it

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsProcessing(true);

        try {
            // Dynamically import libraries to avoid SSR issues
            const imageCompression = (await import('browser-image-compression')).default;
            const heic2any = (await import('heic2any')).default;

            const processedImages: string[] = [];

            for (let i = 0; i < files.length; i++) {
                let file = files[i];

                // Handle HEIC/HEIF files (same as before)
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

                // Compress image - optimized for bandwidth
                const options = {
                    maxSizeMB: 0.3, // Further reduced for ImageKit bandwidth savings
                    maxWidthOrHeight: 1920,
                    useWebWorker: true,
                    initialQuality: 0.75, // Balanced quality/size
                    fileType: 'image/webp' // WebP offers 25-35% better compression than JPEG
                };

                try {
                    const compressedFile = await imageCompression(file, options);

                    // Upload to ImageKit via API
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
            // Reset input
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

        // Set the main image as imageUrl
        formData.set('imageUrl', images[mainImageIndex]);
        // Set all images as JSON string
        formData.set('images', JSON.stringify(images));

        // Remove empty size rows and set sizes
        const validSizes = sizes.filter(s => s.size.trim() !== '');
        if (validSizes.length > 0) {
            formData.set('sizes', JSON.stringify(validSizes));
            // Set total stock as sum of sizes
            const totalStock = validSizes.reduce((sum, s) => sum + s.stock, 0);
            formData.set('stock', totalStock.toString());
            // Set display size as comma joined
            formData.set('size', validSizes.map(s => s.size).join(', '));
        } else {
            if (sizes.every(s => s.size === '')) {
                formData.set('stock', '0');
            }
        }

        // Convert weight to grams
        const weightInGrams = weightValue ?
            (weightUnit === 'kg' ? parseFloat(weightValue) * 1000 : parseFloat(weightValue))
            : 750;
        formData.set('weight', Math.round(weightInGrams).toString());
        formData.set('isOffer', isOffer.toString());
        formData.set('isTrending', isTrending.toString());
        formData.set('isNewArrival', isNewArrival.toString());
        formData.set('visibilityTags', JSON.stringify(visibilityTags));

        try {
            await editProduct(product.id, formData, onSuccess ? undefined : `/admin/products?page=${initialPage}`);
            if (onSuccess) onSuccess();
        } catch (error) {
            if ((error as any)?.digest?.startsWith('NEXT_REDIRECT')) {
                throw error;
            }
            console.error('Error updating product:', error);
            alert('Failed to update product');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header removed as it's now in the modal */}

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
                            <div>
                                <label htmlFor="name" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Product Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    id="name"
                                    defaultValue={product.name}
                                    required
                                    className="block w-full rounded-xl border-0 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6 transition-all"
                                    placeholder="e.g. Acid Wash Oversized Tee"
                                />
                            </div>

                            <div>
                                <label htmlFor="description" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Description</label>
                                <textarea
                                    name="description"
                                    id="description"
                                    rows={4}
                                    defaultValue={product.description}
                                    required
                                    className="block w-full rounded-xl border-0 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6 transition-all resize-none"
                                    placeholder="Detailed product description..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label htmlFor="price" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Price (₹)</label>
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                            <span className="text-slate-500 sm:text-sm">₹</span>
                                        </div>
                                        <input
                                            type="number"
                                            name="price"
                                            id="price"
                                            step="0.01"
                                            defaultValue={product.price}
                                            required
                                            className="block w-full rounded-xl border-0 bg-slate-50 pl-8 pr-4 py-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6 transition-all"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="weight" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Weight</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            name="weight_value"
                                            id="weight"
                                            step="0.01"
                                            min="0"
                                            value={weightValue}
                                            onChange={(e) => setWeightValue(e.target.value)}
                                            placeholder="0"
                                            required
                                            className="block w-full rounded-xl border-0 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm transition-all"
                                        />
                                        <select
                                            name="weight_unit"
                                            value={weightUnit}
                                            onChange={(e) => setWeightUnit(e.target.value as 'grams' | 'kg')}
                                            className="w-24 rounded-xl border-0 bg-slate-100 px-2 py-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm transition-all"
                                        >
                                            <option value="grams">g</option>
                                            <option value="kg">kg</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stock & Variants */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Stock & Variants</label>
                                <button
                                    type="button"
                                    onClick={() => setSizes([...sizes, { size: '', stock: 0 }])}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black text-white text-xs font-bold hover:bg-slate-800 transition-colors"
                                >
                                    <Plus className="w-3 h-3" /> Add Variant
                                </button>
                            </div>
                            <div className="space-y-2">
                                {sizes.map((item, index) => (
                                    <div key={index} className="flex gap-3 items-center group">
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                placeholder="Size (e.g. M)"
                                                value={item.size}
                                                onChange={(e) => {
                                                    const newSizes = [...sizes];
                                                    newSizes[index].size = e.target.value;
                                                    setSizes(newSizes);
                                                }}
                                                className="block w-full rounded-xl border-0 bg-slate-50 px-3 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm transition-all text-center font-medium"
                                            />
                                        </div>
                                        <div className="w-24">
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
                                                className="block w-full rounded-xl border-0 bg-slate-50 px-3 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm transition-all text-center"
                                            />
                                        </div>
                                        {sizes.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => setSizes(sizes.filter((_, i) => i !== index))}
                                                className="p-2 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-slate-400 mt-4 text-right font-medium">
                                Total Stock: <span className="text-slate-900">{sizes.reduce((sum, s) => sum + s.stock, 0)}</span>
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Gallery</label>
                                <span className="text-xs text-slate-400">{images.length}/10 images</span>
                            </div>

                            <div className="bg-slate-50 p-6 rounded-xl border-2 border-dashed border-slate-200 hover:border-slate-300 transition-colors">
                                <div className="flex gap-3 mb-6 justify-center">
                                    <button
                                        type="button"
                                        onClick={() => setImageOption('url')}
                                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all active:scale-95 ${imageOption === 'url' ? 'bg-black text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
                                    >
                                        ADD URL
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setImageOption('upload')}
                                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all active:scale-95 ${imageOption === 'upload' ? 'bg-black text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
                                    >
                                        UPLOAD FILE
                                    </button>
                                </div>

                                {imageOption === 'url' ? (
                                    <div className="flex gap-2">
                                        <input
                                            type="url"
                                            value={currentInput}
                                            onChange={(e) => setCurrentInput(e.target.value)}
                                            placeholder="https://example.com/image.jpg"
                                            className="flex-1 rounded-xl border-0 bg-white px-4 py-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm transition-all"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddUrl();
                                                }
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddUrl}
                                            className="bg-black text-white px-6 py-2 rounded-xl hover:bg-slate-800 text-sm font-bold active:scale-95 transition-all shadow-lg shadow-black/10"
                                        >
                                            Add
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <label className={`cursor-pointer inline-flex flex-col items-center justify-center w-full h-40 border-slate-300 rounded-xl hover:bg-slate-100/50 transition-all ${isProcessing ? 'opacity-50 cursor-wait' : ''}`}>
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                {isProcessing ? (
                                                    <>
                                                        <Loader2 className="w-8 h-8 mb-3 text-black animate-spin" />
                                                        <p className="mb-2 text-sm text-slate-500 font-medium">Compressing & Uploading...</p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-slate-100">
                                                            <Upload className="w-5 h-5 text-slate-400" />
                                                        </div>
                                                        <p className="mb-1 text-sm text-slate-900 font-semibold">Click to upload images</p>
                                                        <p className="text-xs text-slate-500">PNG, JPG, HEIC, WEBP</p>
                                                    </>
                                                )}
                                            </div>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*,.heic,.heif"
                                                multiple
                                                onChange={handleImageUpload}
                                                disabled={isProcessing}
                                            />
                                        </label>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                {images.map((img, index) => (
                                    <div key={index} className={`relative aspect-square rounded-xl overflow-hidden border group ${index === mainImageIndex ? 'border-2 border-black ring-2 ring-black/5' : 'border-slate-200'}`}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={img}
                                            alt={`Product ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />

                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-[2px]">
                                            <button
                                                type="button"
                                                onClick={() => setMainImageIndex(index)}
                                                className={`p-2 rounded-full active:scale-90 transition-all ${index === mainImageIndex ? 'bg-yellow-400 text-white' : 'bg-white text-black hover:bg-yellow-400 hover:text-white'}`}
                                                title="Set as Main Image"
                                            >
                                                <Star className={`w-4 h-4 ${index === mainImageIndex ? 'fill-current' : ''}`} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                className="p-2 rounded-full bg-white text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-90"
                                                title="Remove Image"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {index === mainImageIndex && (
                                            <div className="absolute top-1 left-1 bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                                                MAIN
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Attributes & Meta */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Category</label>
                            <CategorySelector
                                currentCategory={category}
                                onCategoryChange={setCategory}
                            />
                            <input type="hidden" name="category" value={category} />
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Quick Actions</h3>

                            <label className="flex items-center justify-between cursor-pointer group">
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-900 group-hover:text-black transition-colors">Hot Offer</span>
                                    <span className="text-[10px] text-slate-500 font-medium">Show in &quot;Best Offers&quot;</span>
                                </div>
                                <div className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={isOffer} onChange={(e) => setIsOffer(e.target.checked)} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                                </div>
                            </label>

                            <label className="flex items-center justify-between cursor-pointer group">
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-900 group-hover:text-black transition-colors">Trending</span>
                                    <span className="text-[10px] text-slate-500 font-medium">Mark as trending</span>
                                </div>
                                <div className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={isTrending} onChange={(e) => setIsTrending(e.target.checked)} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-red"></div>
                                </div>
                            </label>

                            <label className="flex items-center justify-between cursor-pointer group">
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-900 group-hover:text-black transition-colors">Legacy New</span>
                                    <span className="text-[10px] text-slate-500 font-medium">Old system flag</span>
                                </div>
                                <div className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={isNewArrival} onChange={(e) => setIsNewArrival(e.target.checked)} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                                </div>
                            </label>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Nav Visibility</h3>
                            <div className="space-y-3">
                                {VISIBILITY_HEADERS.map(header => (
                                    <label key={header.id} className="flex items-center gap-3 cursor-pointer group">
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${visibilityTags.includes(header.id) ? 'bg-black border-black text-white' : 'bg-white border-slate-300 group-hover:border-slate-400'}`}>
                                            {visibilityTags.includes(header.id) && <Plus className="w-3.5 h-3.5" />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={visibilityTags.includes(header.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setVisibilityTags(prev => [...prev, header.id]);
                                                } else {
                                                    setVisibilityTags(prev => prev.filter(t => t !== header.id));
                                                }
                                            }}
                                        />
                                        <span className={`text-sm font-medium transition-colors ${visibilityTags.includes(header.id) ? 'text-black' : 'text-slate-600 group-hover:text-slate-900'}`}>{header.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={() => onSuccess ? onSuccess() : window.history.back()}
                        className="px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || isProcessing || images.length === 0}
                        className="bg-black text-white px-8 py-2.5 rounded-xl hover:bg-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-black/20 active:scale-95 flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving
                            </>
                        ) : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}
