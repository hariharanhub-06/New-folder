"use client";

import { useState, useEffect } from 'react';
import { Product } from '@/lib/types';
import { X, ArrowLeft, ShoppingBag, Check, Plus, Minus, Truck, CreditCard, RotateCcw } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { getProduct } from '@/lib/api';
import { optimizeImageUrl } from '@/lib/imagekit';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ProductDetailProps {
    product: Product;
    initialActiveImage?: string;
    isModal?: boolean;
    onClose?: () => void;
}

export default function ProductDetail({ product: initialProduct, initialActiveImage, isModal = false, onClose }: ProductDetailProps) {
    const router = useRouter();
    const [product, setProduct] = useState<Product>(initialProduct);
    const [activeImage, setActiveImage] = useState(initialActiveImage || initialProduct.imageUrl);
    const [selectedSize, setSelectedSize] = useState<string>('');
    const { addToCart, decrementFromCart, items } = useCart();

    const images = (product.images && product.images.length > 0 ? product.images : [product.imageUrl]).filter(Boolean);
    const fallbackImage = "https://images.unsplash.com/photo-1552066344-24632e509613?q=80&w=1000&auto=format&fit=crop";

    const getCurrentStock = () => {
        if (product.sizes && product.sizes.length > 0) {
            const variant = product.sizes.find(s => s.size === selectedSize);
            return variant ? variant.stock : 0;
        }
        return product.stock;
    };

    const currentStock = getCurrentStock();
    const isOutOfStock = currentStock === 0;

    const cartItem = items.find(item => item.id === product.id && (product.sizes?.length ? item.selectedSize === selectedSize : true));
    const quantityInCart = cartItem?.quantity || 0;
    const canAddMore = quantityInCart < currentStock;

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const fullProduct = await getProduct(product.id);
                if (fullProduct) {
                    setProduct(fullProduct);
                    if (fullProduct.sizes && fullProduct.sizes.length > 0) {
                        const available = fullProduct.sizes.find(s => s.stock > 0);
                        if (available && !selectedSize) setSelectedSize(available.size);
                        else if (!selectedSize) setSelectedSize(fullProduct.sizes[0].size);
                    } else if (fullProduct.size && !selectedSize) {
                        setSelectedSize(fullProduct.size);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch product details', error);
            }
        };
        fetchDetails();
    }, [product.id, selectedSize]);

    return (
        <div className={`bg-white w-full flex flex-col md:flex-row font-jost ${isModal ? 'max-h-[95vh] overflow-y-auto' : ''}`}>

            {/* Close Button (Modal Only) */}
            {isModal && onClose && (
                <button onClick={onClose} className="absolute top-4 right-4 z-[70] p-2 bg-white/90 backdrop-blur-md rounded-full border border-gray-100 shadow-sm hover:text-brand-red transition-all active:scale-90">
                    <X className="w-5 h-5 text-black" />
                </button>
            )}

            {/* Left Column: Image Gallery */}
            <div className="w-full md:w-[60%] flex flex-col-reverse md:flex-row gap-4 p-4 md:p-6 bg-white">
                {/* Vertical Thumbnails */}
                <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto no-scrollbar md:w-20 lg:w-24">
                    {images.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={() => setActiveImage(img)}
                            className={`relative aspect-[3/4] w-16 md:w-full flex-shrink-0 border-2 transition-all ${activeImage === img ? 'border-brand-red' : 'border-transparent hover:border-gray-200'}`}
                        >
                            <Image
                                src={optimizeImageUrl(img)}
                                alt={product.name}
                                fill
                                className="object-cover"
                                loading="lazy"
                            />
                        </button>
                    ))}
                </div>

                {/* Main Large Image */}
                <div className="flex-1 relative aspect-[3/4] bg-[#f9f9f9] overflow-hidden">
                    <Image
                        src={optimizeImageUrl(activeImage)}
                        alt={product.name}
                        fill
                        priority
                        className="object-cover"
                    />
                    {product.activeDiscount && (
                        <div className="absolute top-4 left-0 z-10">
                            <span className="bg-brand-red text-white text-[10px] md:text-xs font-bold px-4 py-1.5 uppercase tracking-widest">
                                {product.activeDiscount.percentage}% OFF
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column: Details */}
            <div className="w-full md:w-[40%] p-6 md:p-10 lg:p-14 flex flex-col bg-white">
                <div className="space-y-6">
                    <div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mb-2">{product.category}</div>
                        <div className="flex items-center justify-between gap-4">
                            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-black leading-tight uppercase tracking-tight">
                                {product.name}
                            </h1>
                        </div>
                    </div>

                    {/* Price Section */}
                    <div className="flex items-baseline gap-4">
                        {product.activeDiscount?.percentage ? (
                            <div className="flex items-center gap-3">
                                <span className="text-3xl font-bold text-brand-red">
                                    ₹{Math.floor(product.price * (1 - product.activeDiscount.percentage / 100))}
                                </span>
                                <span className="text-lg text-gray-400 line-through">₹{product.price}</span>
                            </div>
                        ) : (
                            <span className="text-3xl font-bold text-black">₹{product.price}</span>
                        )}
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">In Stock</span>
                    </div>

                    <div className="h-px bg-gray-100 w-full"></div>

                    {/* Size Selection */}
                    {product.sizes && product.sizes.length > 0 && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-black">Select Size</h3>
                                <button className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-brand-red transition-colors underline">Size Guide</button>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {product.sizes.map((s) => (
                                    <button
                                        key={s.size}
                                        onClick={() => setSelectedSize(s.size)}
                                        disabled={s.stock === 0}
                                        className={`
                                            w-12 h-12 flex items-center justify-center text-sm font-bold transition-all border-2
                                            ${selectedSize === s.size
                                                ? 'border-brand-red text-white bg-black scale-110 shadow-lg z-10'
                                                : 'border-black text-black hover:bg-gray-50'
                                            }
                                            ${s.stock === 0 ? 'opacity-30 cursor-not-allowed line-through' : 'active:scale-95'}
                                        `}
                                    >
                                        {s.size}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quantity Section (If in cart) */}
                    {quantityInCart > 0 && (
                        <div className="flex items-center gap-4 py-4 px-6 bg-gray-50 border border-black/5">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">In Cart</div>
                            <div className="flex items-center gap-6">
                                <button onClick={() => decrementFromCart(product.id, selectedSize)} className="hover:text-brand-red p-1"><Minus className="w-4 h-4" /></button>
                                <span className="text-lg font-bold">{quantityInCart}</span>
                                <button onClick={() => addToCart(product, selectedSize)} disabled={!canAddMore} className="hover:text-brand-red p-1 disabled:opacity-30"><Plus className="w-4 h-4" /></button>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-4 pt-4">
                        <button
                            onClick={() => {
                                if (quantityInCart > 0) {
                                    router.push('/checkout');
                                } else {
                                    addToCart(product, selectedSize || undefined);
                                }
                            }}
                            disabled={(!canAddMore && quantityInCart === 0) || (product.sizes && product.sizes.length > 0 && !selectedSize) || isOutOfStock}
                            className={`w-full py-5 text-sm font-bold uppercase tracking-[0.3em] shadow-xl transition-all active:scale-[0.98] ${isOutOfStock
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : (!selectedSize && product.sizes?.length ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-black text-white hover:bg-brand-red shadow-brand-red/10')
                                }`}
                        >
                            {isOutOfStock
                                ? 'Sold Out'
                                : (!selectedSize && product.sizes?.length
                                    ? 'Select A Size'
                                    : (quantityInCart > 0 ? 'Go to Cart' : 'Add to Cart'))}
                        </button>

                    </div>

                    {/* Delivery Info */}
                    <div className="grid grid-cols-1 gap-4 pt-6">
                        <div className="flex items-start gap-4">
                            <Truck className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-black mb-1">Estimated Delivery</div>
                                <div className="text-xs text-gray-500">Up to 4 to 6 business days</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <CreditCard className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-black mb-1">Cash on Delivery</div>
                                <div className="text-xs text-gray-500">Service fees applies</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <RotateCcw className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-black mb-1">Secure Checkout</div>
                                <div className="text-xs text-gray-500">Guaranteed Safe and Secure Checkout</div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-black mb-3">Product Description</div>
                        <div className="text-sm text-gray-600 leading-relaxed prose prose-sm max-w-none">
                            {product.description}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
