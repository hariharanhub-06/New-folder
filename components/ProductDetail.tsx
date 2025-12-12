"use client";

import { useState, useEffect } from 'react';
import { Product } from '@/lib/types';
import { X, ArrowLeft, ShoppingBag, Check } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { getProduct } from '@/lib/api';

interface ProductDetailProps {
    product: Product;
    initialActiveImage?: string;
    isModal?: boolean; // To conditionally render close buttons etc.
    onClose?: () => void;
}

export default function ProductDetail({ product: initialProduct, initialActiveImage, isModal = false, onClose }: ProductDetailProps) {
    const [product, setProduct] = useState<Product>(initialProduct);
    const [activeImage, setActiveImage] = useState(initialActiveImage || initialProduct.imageUrl);
    const [isZoomed, setIsZoomed] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const { addToCart, items } = useCart();
    const [selectedSize, setSelectedSize] = useState<string>('');

    // Ensure we have a list of images
    const images = product.images && product.images.length > 0 ? product.images : [product.imageUrl];

    // Determine current stock
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
    const cartItem = items.find(item => item.id === product.id && (product.sizes?.length ? item.selectedSize === selectedSize : true));
    const quantityInCart = cartItem?.quantity || 0;
    const canAddMore = quantityInCart < currentStock;

    // Fetch full details if needed (mostly for fresh loading if initialProduct is partial)
    // If not in modal, we might already have full data, but good to ensure.
    useEffect(() => {
        const fetchDetails = async () => {
            try {
                // Determine if we need to fetch. If we already have sizes or other details, maybe skip?
                // But generally safe to refresh.
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
    }, [product.id]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isZoomed) return;
        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;
        setMousePos({ x, y });
    };

    return (
        <div className={`bg-white w-full flex flex-col md:flex-row ${isModal ? 'rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden' : ''}`}>

            {/* Close / Back Button for Modal */}
            {isModal && onClose && (
                <button onClick={onClose} className="absolute top-4 left-4 z-10 p-2 bg-white/80 backdrop-blur-md rounded-full shadow-lg hover:bg-white transition-colors active:scale-90">
                    <ArrowLeft className="w-5 h-5 text-gray-800" />
                </button>
            )}

            {/* Image Gallery Section */}
            <div className={`w-full md:w-1/2 bg-gray-50 flex flex-col ${isModal ? 'h-[50vh] md:h-auto' : ''}`}>
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
            <div className={`w-full md:w-1/2 p-6 md:p-10 flex flex-col ${isModal ? 'overflow-y-auto' : ''} bg-white`}>
                <div className="mb-auto">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider rounded-full">
                            {product.category}
                        </span>
                        {/* Discount Badge in Detail View */}
                        {product.activeDiscount && (
                            <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full text-white ${product.activeDiscount.discountType === 'bundle'
                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500'
                                    : 'bg-gradient-to-r from-green-500 to-emerald-500'
                                }`}>
                                {product.activeDiscount.discountType === 'bundle'
                                    ? `Buy ${product.activeDiscount.quantity} @ ₹${product.activeDiscount.price}`
                                    : `${product.activeDiscount.percentage}% OFF`
                                }
                            </span>
                        )}
                    </div>

                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                        {product.name}
                    </h1>

                    <div className="flex items-baseline gap-4 mb-6">
                        {product.activeDiscount?.discountType === 'percentage' && product.activeDiscount.percentage ? (
                            <>
                                <span className="text-xl text-slate-400 line-through">₹{product.price.toFixed(2)}</span>
                                <span className="text-3xl font-bold text-green-600">
                                    ₹{(product.price * (1 - product.activeDiscount.percentage / 100)).toFixed(2)}
                                </span>
                            </>
                        ) : (
                            <span className="text-3xl font-bold text-gray-900">₹{product.price.toFixed(2)}</span>
                        )}

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
    );
}
