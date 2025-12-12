"use client";

import { Product } from '@/lib/types';
import { useCart } from '@/lib/cart-context';
import Image from 'next/image';
import { ShoppingBag, Plus, Package } from 'lucide-react';
import { memo } from 'react';

interface ProductCardProps {
    product: Product;
    onSelect?: (product: Product) => void;
}

// Memoize to prevent unnecessary re-renders
const ProductCard = memo(function ProductCard({ product, onSelect }: ProductCardProps) {
    const { addToCart, items } = useCart();

    // Check if product has size variants
    const hasSizes = product.sizes && product.sizes.length > 0;

    // Get current quantity in cart for this product (all sizes combined if has sizes)
    const cartItems = items.filter(item => item.id === product.id);
    const quantityInCart = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const canAddMore = quantityInCart < product.stock;
    const isOutOfStock = product.stock === 0;

    const handleAddToCart = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent opening modal

        // If product has sizes, open the modal to select size
        if (hasSizes) {
            onSelect?.(product);
        } else {
            // For products without sizes, add directly
            if (canAddMore) {
                addToCart(product);
            }
        }
    };

    return (
        <div
            onClick={() => onSelect?.(product)}
            className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-slate-100 cursor-pointer active:scale-[0.99]"
        >
            <div className="relative h-40 w-full overflow-hidden bg-gray-100">
                <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    loading="lazy"
                    quality={75}
                    placeholder="blur"
                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2VlZSIvPjwvc3ZnPg=="
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

                {/* Discount Badge - Top Right */}
                {product.discountPercentage && product.discountPercentage > 0 && (
                    <div className="absolute top-2 right-2 z-10">
                        <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                            </svg>
                            {product.discountPercentage}% OFF
                        </span>
                    </div>
                )}

                {/* Stock Badge */}
                <div className="absolute top-2 left-2">
                    {isOutOfStock ? (
                        <span className="bg-red-500 text-white text-[9px] font-bold px-2 py-1 rounded">
                            OUT OF STOCK
                        </span>
                    ) : product.stock <= 5 ? (
                        <span className="bg-orange-500 text-white text-[9px] font-bold px-2 py-1 rounded flex items-center gap-1">
                            <Package className="w-2.5 h-2.5" />
                            {product.stock} left
                        </span>
                    ) : (
                        <span className="bg-green-500 text-white text-[9px] font-bold px-2 py-1 rounded flex items-center gap-1">
                            <Package className="w-2.5 h-2.5" />
                            {product.stock} in stock
                        </span>
                    )}
                </div>

                {/* Quick Add Button */}
                <button
                    onClick={handleAddToCart}
                    disabled={!canAddMore && !hasSizes}
                    className="absolute bottom-2 right-2 bg-white text-slate-900 p-1.5 rounded-full shadow-lg translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hover:bg-amber-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed active:scale-90"
                    title={hasSizes ? 'Select size' : (!canAddMore ? (isOutOfStock ? 'Out of stock' : 'Maximum quantity in cart') : 'Add to cart')}
                >
                    <ShoppingBag className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="p-2.5">
                <div className="flex justify-between items-start mb-0.5">
                    <div className="text-[9px] font-bold text-amber-600 uppercase tracking-wider">{product.category}</div>
                    {hasSizes ? (
                        <span className="text-[9px] font-medium text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded">
                            {product.sizes.length} sizes
                        </span>
                    ) : product.size && (
                        <span className="text-[9px] font-medium text-slate-500 bg-slate-100 px-1 py-0.5 rounded">
                            {product.size}
                        </span>
                    )}
                </div>
                <h3 className="text-xs font-bold text-slate-900 mb-0.5 line-clamp-1">{product.name}</h3>
                <p className="text-[10px] text-slate-500 mb-1.5 line-clamp-2 leading-tight">{product.description}</p>
                <div className="flex items-center justify-between mt-1.5">
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">₹{product.price.toFixed(2)}</span>
                        {quantityInCart > 0 && (
                            <span className="text-[9px] text-amber-600 font-medium">
                                {quantityInCart} in cart
                            </span>
                        )}
                    </div>
                    <button
                        onClick={handleAddToCart}
                        disabled={!canAddMore && !hasSizes}
                        className="bg-slate-900 text-white p-1.5 rounded-full hover:bg-amber-500 hover:text-slate-900 transition-all duration-300 shadow-md hover:shadow-amber-500/50 group disabled:opacity-50 disabled:cursor-not-allowed active:scale-90"
                        title={hasSizes ? 'Select size' : (!canAddMore ? (isOutOfStock ? 'Out of stock' : 'Maximum quantity in cart') : 'Add to cart')}
                    >
                        <Plus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
});

export default ProductCard;
