"use client";

import { Product } from '@/lib/types';
import { optimizeImageUrl } from '@/lib/imagekit';
import Image from 'next/image';
import { Flame } from 'lucide-react';

interface OfferDropGridProps {
    products: Product[];
    onProductSelect: (product: Product) => void;
}

export default function OfferDropGrid({ products, onProductSelect }: OfferDropGridProps) {
    if (!products || products.length === 0) return null;

    return (
        <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
                <Flame className="w-5 h-5 text-brand-red fill-current animate-pulse" />
                <h2 className="text-lg font-bold uppercase tracking-widest text-black">
                    Offer Drops ({products.length})
                </h2>
                <span className="bg-black text-white text-[10px] px-2 py-0.5 font-bold uppercase tracking-widest ml-2">Limited Time</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8">
                {products.map((product) => (
                    <div
                        key={product.id}
                        className="group cursor-pointer flex flex-col items-center text-center"
                        onClick={() => onProductSelect(product)}
                    >
                        {/* Circular Image Frame */}
                        <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-2 border-gray-100 group-hover:border-brand-red transition-colors shadow-sm mb-3">
                            <Image
                                src={optimizeImageUrl(product.imageUrl)}
                                alt={product.name}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-700"
                                sizes="(max-width: 768px) 128px, 160px"
                                loading="lazy"
                            />
                            {/* Overlay on hover */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

                            {/* Discount Badge (Mini) */}
                            {product.activeDiscount && (
                                <div className="absolute top-2 right-2 md:top-3 md:right-3 bg-brand-red text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                                    -{product.activeDiscount.percentage}%
                                </div>
                            )}
                        </div>

                        {/* Product Info */}
                        <h3 className="text-xs md:text-sm font-medium text-black line-clamp-2 leading-tight max-w-[140px] group-hover:text-brand-red transition-colors mb-1">
                            {product.name}
                        </h3>

                        <div className="flex items-center gap-2 text-xs">
                            {product.activeDiscount ? (
                                <>
                                    <span className="font-bold text-brand-red">
                                        ₹{Math.floor(product.price * (1 - product.activeDiscount.percentage / 100))}
                                    </span>
                                    <span className="text-gray-400 line-through text-[10px]">
                                        ₹{product.price}
                                    </span>
                                </>
                            ) : (
                                <span className="font-bold">₹{product.price}</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
