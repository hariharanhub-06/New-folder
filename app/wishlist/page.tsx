"use client";

import { useWishlist } from "@/lib/wishlist-context";
import { useCart } from "@/lib/cart-context";
import Link from "next/link";
import Image from "next/image";
import { UnifrakturMaguntia } from "next/font/google";
import { Trash2, ShoppingCart, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";

const gothic = UnifrakturMaguntia({
    weight: "400",
    subsets: ["latin"],
});

export default function WishlistPage() {
    const { items, removeFromWishlist } = useWishlist();
    const { addToCart } = useCart();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="min-h-screen bg-[#F4F3EF]"></div>;

    const handleAddToCart = (product: any) => {
        addToCart(product);
        // Optional: Remove from wishlist after adding to cart? User preference varies.
        // removeFromWishlist(product.id); 
    };

    return (
        <div className="min-h-screen bg-[#F4F3EF] pt-8 pb-20 font-jost">
            <div className="container mx-auto px-4 max-w-6xl">
                <h1 className={`${gothic.className} text-4xl md:text-5xl text-center mb-12`}>Your Wishlist</h1>

                {items.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-lg shadow-sm border border-gray-100">
                        <p className="text-xl text-gray-400 mb-8 font-light">Your wishlist is empty.</p>
                        <Link
                            href="/shop"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-brand-red transition-colors"
                        >
                            Start Shopping <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {items.map((product) => (
                            <div key={product.id} className="bg-white group overflow-hidden border border-gray-100 flex flex-col">
                                <Link href={`/shop?productId=${product.id}`} className="relative aspect-[3/4] overflow-hidden bg-gray-100 block">
                                    <Image
                                        src={product.imageUrl || "/placeholder.png"}
                                        alt={product.name}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    {product.activeDiscount && (
                                        <div className="absolute top-2 left-0 bg-brand-red text-white text-[10px] font-bold px-2 py-1 uppercase">
                                            -{product.activeDiscount.percentage}%
                                        </div>
                                    )}
                                </Link>
                                <div className="p-4 flex flex-col flex-1">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{product.category}</div>
                                    <Link href={`/shop?productId=${product.id}`} className="font-medium text-black line-clamp-1 mb-3 hover:text-brand-red transition-colors">
                                        {product.name}
                                    </Link>

                                    <div className="flex items-center justify-between mt-auto mb-4">
                                        <div className="font-bold">
                                            {product.activeDiscount ? (
                                                <div className="flex flex-col leading-none">
                                                    <span className="text-brand-red">₹{Math.floor(product.price * (1 - product.activeDiscount.percentage / 100))}</span>
                                                    <span className="text-xs text-gray-300 line-through">₹{product.price}</span>
                                                </div>
                                            ) : (
                                                <span>₹{product.price}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleAddToCart(product)}
                                            className="flex-1 flex items-center justify-center gap-2 bg-black text-white py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors"
                                        >
                                            <ShoppingCart className="w-3 h-3" /> Add to Cart
                                        </button>
                                        <button
                                            onClick={() => removeFromWishlist(product.id)}
                                            className="px-3 py-2 border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-600 transition-colors"
                                            title="Remove from Wishlist"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
