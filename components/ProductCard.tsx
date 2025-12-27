"use client";

import { Product } from '@/lib/types';
import { useCart } from '@/lib/cart-context';
import { useWishlist } from '@/lib/wishlist-context';
import Image from 'next/image';
import { ShoppingBag, Search, Plus, ArrowRight, Share2, Check, Heart } from 'lucide-react';
import { memo, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ProductCardProps {
    product: Product;
    onSelect?: (product: Product) => void;
    variant?: 'default' | 'small';
}

const ProductCard = memo(function ProductCard({ product, onSelect, variant = 'default' }: ProductCardProps) {
    const router = useRouter();
    const { addToCart, items } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();

    const hasSizes = product.sizes && product.sizes.length > 0;
    const cartItems = items.filter(item => item.id === product.id);
    const quantityInCart = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const canAddMore = quantityInCart < product.stock;
    const isOutOfStock = product.stock === 0;
    const isWishlisted = isInWishlist(product.id);

    const handleAddToCart = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (quantityInCart > 0 && !hasSizes) {
            router.push('/checkout');
        } else if (hasSizes) {
            onSelect?.(product);
        } else if (canAddMore) {
            addToCart(product);
        }
    };

    const handleToggleWishlist = (e: React.MouseEvent) => {
        e.stopPropagation();
        console.log("ProductCard: Toggling wishlist for", product.id, product.name, "Current state:", isWishlisted);
        toggleWishlist(product);
    };

    const [copied, setCopied] = useState(false);

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const url = `${window.location.origin}/shop?productId=${product.id}`;
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    return (
        <div
            onClick={() => onSelect?.(product)}
            className={`group bg-white rounded-sm overflow-hidden border border-gray-100 cursor-pointer active:scale-[0.98] transition-all flex flex-col h-full font-jost ${variant === 'small' ? 'max-w-[120px]' : ''}`}
        >
            {/* Image Section */}
            <div className="relative aspect-[3/4] w-full bg-[#f9f9f9] overflow-hidden">
                <Image
                    src={product.imageUrl || "https://images.unsplash.com/photo-1552066344-24632e509613?q=80&w=1000&auto=format&fit=crop"}
                    alt={product.name}
                    fill
                    sizes={variant === 'small' ? "120px" : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"}
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                    unoptimized={!!product.imageUrl?.startsWith('http')}
                />

                {/* Vertical Icon Stack (Top Right) */}
                <div className="absolute top-2 right-2 z-20 flex flex-col gap-2">
                    {/* Share Button */}
                    <button
                        onClick={handleShare}
                        className="p-1.5 bg-white/90 backdrop-blur-sm rounded-full hover:bg-black hover:text-white transition-all shadow-sm border border-gray-100 group/btn"
                        title="Copy Link"
                    >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                    </button>

                    {/* Wishlist Button */}
                    <button
                        onClick={handleToggleWishlist}
                        className={`p-1.5 bg-white/90 backdrop-blur-sm rounded-full transition-all shadow-sm border border-gray-100 group/btn ${isWishlisted ? 'text-brand-red' : 'text-gray-400 hover:text-brand-red'}`}
                        title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                    >
                        <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
                    </button>
                </div>

                {/* Sale Badge (Top Left - Rectangular) */}
                {product.activeDiscount && (
                    <div className="absolute top-3 left-0 z-10">
                        <span className="bg-brand-red text-white text-[10px] font-bold px-3 py-1 uppercase tracking-tighter">
                            {product.activeDiscount.percentage}% OFF
                        </span>
                    </div>
                )}

                {/* Status Badges (Top Right - Below Icons) */}
                <div className="absolute top-20 right-2 z-10 flex flex-col gap-1 items-end">
                    {isOutOfStock ? (
                        <span className="bg-black text-white text-[8px] font-bold px-2 py-0.5 uppercase">Out of Stock</span>
                    ) : product.stock <= 5 && (
                        <span className="bg-white text-brand-red border border-brand-red text-[8px] font-bold px-2 py-0.5 uppercase">Only {product.stock} left</span>
                    )}
                </div>

                {/* Quick Action Overlay (Bottom) */}
                <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-black/5 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex gap-2">
                    <button
                        onClick={handleAddToCart}
                        className="flex-1 bg-black text-white py-2.5 text-[10px] font-bold uppercase tracking-widest hover:bg-brand-red transition-colors flex items-center justify-center gap-2"
                    >
                        {quantityInCart > 0 && !hasSizes ? <ArrowRight className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                        {hasSizes ? 'Select Size' : (quantityInCart > 0 ? 'Go to Cart' : 'Add to Cart')}
                    </button>
                </div>
            </div>

            {/* Content Section */}
            <div className={`${variant === 'small' ? 'p-2' : 'p-4'} flex flex-col flex-1`}>
                {!variant || variant === 'default' && <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">{product.category}</div>}
                <h3 className={`${variant === 'small' ? 'text-[10px]' : 'text-sm'} font-medium text-black line-clamp-2 leading-tight mb-2 group-hover:text-brand-red transition-colors`}>
                    {product.name}
                </h3>

                <div className="mt-auto flex items-end justify-between">
                    <div className="flex flex-col">
                        {product.activeDiscount?.percentage ? (
                            <div className="flex items-center gap-1 flex-wrap">
                                <span className={`${variant === 'small' ? 'text-sm' : 'text-base'} font-bold text-brand-red`}>
                                    ₹{Math.floor(product.price * (1 - product.activeDiscount.percentage / 100))}
                                </span>
                                <span className={`${variant === 'small' ? 'text-[8px]' : 'text-xs'} text-gray-400 line-through`}>₹{product.price}</span>
                            </div>
                        ) : (
                            <span className={`${variant === 'small' ? 'text-sm' : 'text-base'} font-bold text-black`}>₹{product.price}</span>
                        )}
                    </div>
                    {quantityInCart > 0 && (
                        <div className="bg-gray-100 text-[10px] px-2 py-1 font-bold text-black border border-gray-200">
                            IN CART: {quantityInCart}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

export default ProductCard;
