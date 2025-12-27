"use client";

import { useState, useEffect } from 'react';
import { Upload, X, Star, Image as ImageIcon, Loader2, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
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

export default function NewProductPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [imageOption, setImageOption] = useState<'url' | 'upload'>('url');
    const [images, setImages] = useState<string[]>([]);
    const [mainImageIndex, setMainImageIndex] = useState<number>(0);
    const [currentInput, setCurrentInput] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [sizes, setSizes] = useState<{ size: string; stock: number }[]>([{ size: '', stock: 0 }]);
    const [productId, setProductId] = useState<string>('');
    const [weightValue, setWeightValue] = useState<string>('');
    const [weightUnit, setWeightUnit] = useState<'grams' | 'kg'>('grams');
    // Category state is now just the string
    const [category, setCategory] = useState<string>('Shirt');
    const [isOffer, setIsOffer] = useState(false);
    const [isTrending, setIsTrending] = useState(false);
    const [isNewArrival, setIsNewArrival] = useState(false);
    const [visibilityTags, setVisibilityTags] = useState<string[]>([]);


    // Prevent SSR issues
    useEffect(() => {
        setMounted(true);
        setProductId(crypto.randomUUID());
    }, []);

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

                // Compress image
                const options = {
                    maxSizeMB: 1, // Increased to 1MB since we are uploading to cloud, not base64 DB
                    maxWidthOrHeight: 1920, // Better quality for cloud
                    useWebWorker: true,
                    fileType: 'image/jpeg'
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

        try {
            const formData = new FormData(e.currentTarget);

            // Prepare product data
            const validSizes = sizes.filter(s => s.size.trim() !== '');
            const totalStock = validSizes.length > 0 ? validSizes.reduce((sum, s) => sum + s.stock, 0) : 0;

            // Convert weight to grams
            const weightInGrams = weightValue ?
                (weightUnit === 'kg' ? parseFloat(weightValue) * 1000 : parseFloat(weightValue))
                : 750; // Default 750g if not specified

            const productData = {
                id: productId, // Idempotency Key
                name: formData.get('name') as string,
                description: formData.get('description') as string,
                price: parseFloat(formData.get('price') as string),
                category: category,
                stock: totalStock,
                size: validSizes.length > 0 ? validSizes.map(s => s.size).join(', ') : '',
                imageUrl: images[mainImageIndex],
                images: images,
                sizes: validSizes.length > 0 ? validSizes : undefined,
                weight: Math.round(weightInGrams), // Store as integer grams
                isActive: true,
                isOffer: isOffer,
                isTrending: isTrending,
                isNewArrival: isNewArrival,
                visibilityTags: visibilityTags
            };

            // Call API directly
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(productData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to add product');
            }

            // Success - redirect to products page
            router.push('/admin/products');
        } catch (error) {
            console.error('Error adding product:', error);
            const errorMessage = (error as Error).message || 'Failed to add product';
            alert(errorMessage);
            setIsSubmitting(false);
        }
    };

    // Prevent SSR hydration mismatch - show loading until mounted
    if (!mounted) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Product</h1>

            <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Product Name</label>
                            <input
                                type="text"
                                name="name"
                                id="name"
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                            />
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea
                                name="description"
                                id="description"
                                rows={4}
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                            />
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price (₹)</label>
                                <input
                                    type="number"
                                    name="price"
                                    id="price"
                                    step="0.01"
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                />
                            </div>

                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-gray-700">Stock & Sizes</label>
                                    <button
                                        type="button"
                                        onClick={() => setSizes([...sizes, { size: '', stock: 0 }])}
                                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                    >
                                        <Plus className="w-3 h-3" /> Add Variant
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {sizes.map((item, index) => (
                                        <div key={index} className="flex gap-2 items-start">
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
                                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm border p-2"
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
                                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm border p-2"
                                                />
                                            </div>
                                            {sizes.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setSizes(sizes.filter((_, i) => i !== index))}
                                                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-2 text-right">
                                    Total Stock: {sizes.reduce((sum, s) => sum + s.stock, 0)}
                                </p>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="weight" className="block text-sm font-medium text-gray-700">Product Weight *</label>
                            <div className="mt-1 flex gap-2">
                                <input
                                    type="number"
                                    name="weight_value"
                                    id="weight"
                                    step="0.01"
                                    min="0"
                                    value={weightValue}
                                    onChange={(e) => setWeightValue(e.target.value)}
                                    placeholder="Enter weight"
                                    required
                                    className="flex-1 block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                />
                                <select
                                    name="weight_unit"
                                    value={weightUnit}
                                    onChange={(e) => setWeightUnit(e.target.value as 'grams' | 'kg')}
                                    className="w-28 block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                >
                                    <option value="grams">Grams</option>
                                    <option value="kg">Kg</option>
                                </select>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                {weightValue && `≈ ${weightUnit === 'kg' ? (parseFloat(weightValue) * 1000).toFixed(0) + 'g' : (parseFloat(weightValue) / 1000).toFixed(3) + 'kg'}`}
                            </p>
                        </div>

                        <div>
                            <CategorySelector
                                currentCategory={category}
                                onCategoryChange={setCategory}
                            />
                            {/* Hidden input for form submission if needed, or we rely on state in handleSubmit */}
                            <input type="hidden" name="category" value={category} />
                        </div>
                    </div>

                    {/* Image Upload Section */}
                    <div className="space-y-6">
                        {/* Display Attributes */}
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Product Attributes</h3>
                            <div className="space-y-2">
                                <label className="flex items-center gap-3 p-2 hover:bg-white rounded-md transition-colors cursor-pointer border border-transparent hover:border-slate-200">
                                    <input
                                        type="checkbox"
                                        checked={isOffer}
                                        onChange={(e) => setIsOffer(e.target.checked)}
                                        className="w-4 h-4 text-brand-red border-gray-300 rounded focus:ring-brand-red"
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-gray-900">Mark as Hot Offer</span>
                                        <span className="text-[10px] text-gray-500">Shows in &quot;Best Offers&quot; tab &amp; includes sale badge</span>
                                    </div>
                                </label>

                                <label className="flex items-center gap-3 p-2 hover:bg-white rounded-md transition-colors cursor-pointer border border-transparent hover:border-slate-200">
                                    <input
                                        type="checkbox"
                                        checked={isTrending}
                                        onChange={(e) => setIsTrending(e.target.checked)}
                                        className="w-4 h-4 text-brand-red border-gray-300 rounded focus:ring-brand-red"
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-gray-900">Trending Now</span>
                                        <span className="text-[10px] text-gray-500">Flags the product for the &quot;Trending&quot; collection</span>
                                    </div>
                                </label>

                                <label className="flex items-center gap-3 p-2 hover:bg-white rounded-md transition-colors cursor-pointer border border-transparent hover:border-slate-200">
                                    <input
                                        type="checkbox"
                                        checked={isNewArrival}
                                        onChange={(e) => setIsNewArrival(e.target.checked)}
                                        className="w-4 h-4 text-brand-red border-gray-300 rounded focus:ring-brand-red"
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-gray-900">Legacy: New Arrival Flag</span>
                                        <span className="text-[10px] text-gray-500">Old system flag</span>
                                    </div>
                                </label>
                            </div>

                            <hr className="border-slate-200" />

                            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Navigation Visibility</h3>
                            <div className="grid grid-cols-1 gap-2">
                                {VISIBILITY_HEADERS.map(header => (
                                    <label key={header.id} className="flex items-center gap-3 p-2 hover:bg-white rounded-md transition-colors cursor-pointer border border-slate-100 hover:border-slate-200 bg-white/50">
                                        <input
                                            type="checkbox"
                                            checked={visibilityTags.includes(header.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setVisibilityTags(prev => [...prev, header.id]);
                                                } else {
                                                    setVisibilityTags(prev => prev.filter(t => t !== header.id));
                                                }
                                            }}
                                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700">{header.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <label className="block text-sm font-medium text-gray-700">Product Images (1-10)</label>

                        <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300">
                            <div className="flex gap-2 mb-4 justify-center">
                                <button
                                    type="button"
                                    onClick={() => setImageOption('url')}
                                    className={`px-3 py-1.5 text-sm rounded-md transition-all active:scale-95 ${imageOption === 'url' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                                >
                                    Add URL
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setImageOption('upload')}
                                    className={`px-3 py-1.5 text-sm rounded-md transition-all active:scale-95 ${imageOption === 'upload' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                                >
                                    Upload File
                                </button>
                            </div>

                            {imageOption === 'url' ? (
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        value={currentInput}
                                        onChange={(e) => setCurrentInput(e.target.value)}
                                        placeholder="https://example.com/image.jpg"
                                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
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
                                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm active:scale-95 transition-transform"
                                    >
                                        Add
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <label className={`cursor-pointer inline-flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg hover:bg-gray-100 transition-colors ${isProcessing ? 'opacity-50 cursor-wait' : ''}`}>
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            {isProcessing ? (
                                                <>
                                                    <Loader2 className="w-8 h-8 mb-3 text-indigo-600 animate-spin" />
                                                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Processing images...</span></p>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="w-8 h-8 mb-3 text-gray-400" />
                                                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span></p>
                                                    <p className="text-xs text-gray-500">PNG, JPG, HEIC or GIF</p>
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

                        {/* Image Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                            {images.map((img, index) => (
                                <div key={index} className={`relative aspect-square rounded-lg overflow-hidden border-2 group ${index === mainImageIndex ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-gray-200'}`}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={img}
                                        alt={`Product ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />

                                    {/* Overlay Actions */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setMainImageIndex(index)}
                                            className={`p-1.5 rounded-full active:scale-90 transition-transform ${index === mainImageIndex ? 'bg-yellow-400 text-white' : 'bg-white text-gray-700 hover:bg-yellow-400 hover:text-white'}`}
                                            title="Set as Main Image"
                                        >
                                            <Star className={`w-4 h-4 ${index === mainImageIndex ? 'fill-current' : ''}`} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="p-1.5 rounded-full bg-white text-red-600 hover:bg-red-600 hover:text-white transition-all active:scale-90"
                                            title="Remove Image"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Main Image Badge */}
                                    {index === mainImageIndex && (
                                        <div className="absolute top-2 left-2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                                            Main
                                        </div>
                                    )}
                                </div>
                            ))}

                            {images.length === 0 && (
                                <div className="col-span-full py-8 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                    <ImageIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                    <p className="text-sm">No images added yet</p>
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 text-right">{images.length}/10 images</p>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={() => window.history.back()}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-all active:scale-95"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || isProcessing || images.length === 0}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-95 flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                            </>
                        ) : 'Save Product'}
                    </button>
                </div>
            </form>
        </div>
    );
}
