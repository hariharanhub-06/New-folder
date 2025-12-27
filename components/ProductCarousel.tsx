"use client";

import { Product } from '@/lib/types';
import ProductCard from '@/components/ProductCard';
import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface ProductCarouselProps {
    products: Product[];
    title: string;
    subtitle: string;
    ctaText: string;
    ctaLink: string;
    onSelect?: (product: Product) => void;
}

export default function ProductCarousel({ products, title, subtitle, ctaText, ctaLink, onSelect }: ProductCarouselProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isAutoScrolling, setIsAutoScrolling] = useState(true);
    const scrollPauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleUserInteraction = () => {
        setIsAutoScrolling(false);
        if (scrollPauseTimeoutRef.current) {
            clearTimeout(scrollPauseTimeoutRef.current);
        }
        scrollPauseTimeoutRef.current = setTimeout(() => {
            setIsAutoScrolling(true);
        }, 4000);
    };

    useEffect(() => {
        if (!products.length || !scrollRef.current || !isAutoScrolling) return;

        const scrollInterval = setInterval(() => {
            if (scrollRef.current) {
                const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
                if (scrollLeft + clientWidth >= scrollWidth - 10) {
                    scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    const scrollAmount = 280;
                    scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                }
            }
        }, 2000);

        return () => clearInterval(scrollInterval);
    }, [products.length, isAutoScrolling]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 280;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    if (!products || products.length === 0) return null;

    return (
        <section className="py-8 md:py-10 bg-white">
            <div className="container mx-auto px-4">
                {/* Title and Subtitle */}
                <div className="text-center mb-6 md:mb-8">
                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-4">
                        {title}
                    </h2>
                    <p className="text-gray-600 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
                        {subtitle}
                    </p>
                </div>

                {/* Product Carousel */}
                <div className="relative overflow-hidden group mb-8">
                    <div
                        ref={scrollRef}
                        onWheel={handleUserInteraction}
                        onTouchStart={handleUserInteraction}
                        onPointerDown={handleUserInteraction}
                        className="flex gap-4 md:gap-6 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory pb-4"
                    >
                        {products.map((product) => (
                            <div key={product.id} className="min-w-[200px] md:min-w-[250px] snap-center flex-shrink-0">
                                <ProductCard product={product} onSelect={onSelect} />
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => scroll('left')}
                        className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 opacity-0 group-hover:opacity-100 transition-opacity z-10 hidden md:block hover:bg-black"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 opacity-0 group-hover:opacity-100 transition-opacity z-10 hidden md:block hover:bg-black"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {/* CTA Button */}
                <div className="text-center">
                    <Link
                        href={ctaLink}
                        className="inline-block px-10 py-3 bg-black text-white font-bold uppercase tracking-widest text-sm hover:bg-brand-red transition-all active:scale-95"
                    >
                        {ctaText}
                    </Link>
                </div>
            </div>

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </section>
    );
}
