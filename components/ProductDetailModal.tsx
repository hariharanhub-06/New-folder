"use client";

import { useState, useEffect } from 'react';
import { Product } from '@/lib/types';
import { X, ArrowLeft, ShoppingBag, Check } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import Image from 'next/image';

import { getProduct } from '@/lib/api';

interface ProductDetailModalProps {
    product: Product;
    onClose: () => void;
}

export default function ProductDetailModal({ product: initialProduct, onClose }: ProductDetailModalProps) {
    const [product, setProduct] = useState<Product>(initialProduct);
    const [activeImage, setActiveImage] = useState(initialProduct.imageUrl);
    const [isZoomed, setIsZoomed] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const { addToCart, items } = useCart();

    // Size Logic
    const [selectedSize, setSelectedSize] = useState<string>('');

    // Ensure we have a list of images, falling back to just the main image if empty
    const images = product.images && product.images.length > 0 ? product.images : [product.imageUrl];

    // Determine current stock and availability
    const getCurrentStock = () => {
        if (product.sizes && product.sizes.length > 0) {
            const variant = product.sizes.find(s => s.size === selectedSize);
            return variant ? variant.stock : 0;
        }
        return product.stock;
    };

    const currentStock = getCurrentStock();
    const isOutOfStock = currentStock === 0;

    // Cart logic
    // Match by ID AND Size if sizes exist
    const cartItem = items.find(item => item.id === product.id && (product.sizes?.length ? item.selectedSize === selectedSize : true));
    const quantityInCart = cartItem?.quantity || 0;
    const canAddMore = quantityInCart < currentStock;

    // Fetch full product details (including images, description) when modal opens
    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const fullProduct = await getProduct(product.id);
                if (fullProduct) {
                    setProduct(fullProduct);
                    // Initialize Size Selection
                    if (fullProduct.sizes && fullProduct.sizes.length > 0) {
                        const available = fullProduct.sizes.find(s => s.stock > 0);
                        if (available) setSelectedSize(available.size);
                        else setSelectedSize(fullProduct.sizes[0].size);
                    } else if (fullProduct.size) {
                        // Legacy size field logic if needed, or just ignore
                        setSelectedSize(fullProduct.size);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch product details', error);
            }
        };
        fetchDetails();
        // Lock body scroll while modal is open
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [product.id]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isZoomed) return;
        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;
        setMousePos({ x, y });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in duration-300">
                {/* Close / Back Button */}
                <button onClick={onClose} className="absolute top-4 left-4 z-10 p-2 bg-white/80 backdrop-blur-md rounded-full shadow-lg hover:bg-white transition-colors active:scale-90">
                    <ArrowLeft className="w-5 h-5 text-gray-800" />
                </button>

                {/* Image Gallery Section */}
                <div className="w-full md:w-1/2 bg-gray-50 flex flex-col h-[50vh] md:h-auto">
                    {/* Main Image Area */}
                    <div
                        className="relative flex-1 overflow-hidden cursor-zoom-in flex items-center justify-center p-4"
                        onMouseEnter={() => setIsZoomed(true)}
                        onMouseLeave={() => setIsZoomed(false)}
                        onMouseMove={handleMouseMove}
                    >
                        <div className="relative w-full h-full max-h-[600px] aspect-square md:aspect-auto">
                            <img
                                src={activeImage}
                                alt={product.name}
                                className={`w-full h-full object-contain transition-transform duration-200 ${isZoomed ? 'scale-150' : 'scale-100'}`}
                                style={isZoomed ? { transformOrigin: `${mousePos.x}% ${mousePos.y}%` } : undefined}
                            />
                        </div>
                    </div>

                    {/* Thumbnails */}
                    <div className="p-4 flex gap-2 overflow-x-auto bg-white border-t border-gray-100">
                        {images.map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveImage(img)}
                                className={`relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all active:scale-95 ${activeImage === img ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-gray-200 hover:border-gray-300'}`}
                            >
                                <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Product Details Section */}
                <div className="w-full md:w-1/2 p-6 md:p-10 overflow-y-auto bg-white flex flex-col">
                    <div className="mb-auto">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider rounded-full">
                                {product.category}
                            </span>
                        </div>

                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                            {product.name}
                        </h2>

                        <div className="flex items-baseline gap-4 mb-6">
                            <span className="text-3xl font-bold text-gray-900">₹{product.price.toFixed(2)}</span>
                            {currentStock <= 5 && !isOutOfStock && (
                                <span className="text-sm font-medium text-orange-600 animate-pulse">
                                    Only {currentStock} left!
                                </span>
                            )}
                        </div>

                        <div className="prose prose-sm text-gray-600 mb-8 leading-relaxed">
                            {product.description}
                        </div>

                        {/* Size Selector */}
                        {product.sizes && product.sizes.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-sm font-medium text-gray-900 mb-3">Select Size</h3>
                                <div className="flex flex-wrap gap-2">
                                    {product.sizes.map((s) => (
                                        <button
                                            key={s.size}
                                            onClick={() => setSelectedSize(s.size)}
                                            disabled={s.stock === 0}
                                            className={`
                                                px-4 py-2 rounded-lg text-sm font-medium transition-all border-2
                                                ${selectedSize === s.size
                                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                                                }
                                                ${s.stock === 0 ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'active:scale-95'}
                                            `}
                                        >
                                            {s.size}
                                            <span className="ml-1 text-xs opacity-60">
                                                {s.stock === 0 ? '(Out)' : `(${s.stock})`}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Area */}
                    <div className="mt-8 pt-8 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-medium text-gray-500">Availability</span>
                            {isOutOfStock ? (
                                <span className="flex items-center gap-1.5 text-red-600 font-medium">
                                    <X className="w-4 h-4" /> Out of Stock {selectedSize ? `(${selectedSize})` : ''}
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5 text-green-600 font-medium">
                                    <Check className="w-4 h-4" /> In Stock {selectedSize ? `(${selectedSize})` : ''}
                                </span>
                            )}
                        </div>

                        <button
                            onClick={() => addToCart(product, selectedSize || undefined)}
                            disabled={!canAddMore || (product.sizes && product.sizes.length > 0 && !selectedSize)}
                            className="w-full py-4 px-6 bg-slate-900 text-white rounded-xl font-bold text-lg shadow-lg shadow-slate-900/10 hover:bg-indigo-600 hover:shadow-indigo-600/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        >
                            <ShoppingBag className="w-5 h-5" />
                            {isOutOfStock ? 'Out of Stock' : canAddMore ? 'Add to Cart' : 'Max Quantity in Cart'}
                        </button>

                        {quantityInCart > 0 && (
                            <p className="text-center text-sm text-gray-500 mt-3">
                                You have {quantityInCart} of this item {selectedSize && `(${selectedSize})`} in your cart
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
