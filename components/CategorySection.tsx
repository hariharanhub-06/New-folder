'use client';

import { useRef, useState, useEffect } from 'react';
import { Product } from '@/lib/types';
import ProductCard from '@/components/ProductCard';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface CategorySectionProps {
    title: string;
    products: Product[];
    className?: string;
}

export default function CategorySection({ title, products, className = '' }: CategorySectionProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);

    const checkScroll = () => {
        if (!scrollContainerRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        setShowLeftArrow(scrollLeft > 0);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10); // 10px buffer
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [products]);

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollContainerRef.current) return;
        const container = scrollContainerRef.current;
        const scrollAmount = container.clientWidth * 0.8; // Scroll 80% of width

        container.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });

        // Timeout to check arrows after scroll animation
        setTimeout(checkScroll, 500);
    };

    if (products.length === 0) return null;

    return (
        <section className={`py-6 border-b border-gray-100 last:border-0 ${className}`}>
            <div className="flex items-center justify-between px-4 sm:px-8 mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 uppercase tracking-wide">
                    {title}
                </h2>
                <Link
                    href={`/shop?category=${encodeURIComponent(title)}`}
                    className="group flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                    View All
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
            </div>

            <div className="relative group/section">
                {/* Left Arrow */}
                {showLeftArrow && (
                    <button
                        onClick={() => scroll('left')}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/90 backdrop-blur-sm border border-slate-200 shadow-lg rounded-full text-slate-700 hover:text-indigo-600 hover:border-indigo-100 transition-all -ml-3 opacity-0 group-hover/section:opacity-100 duration-300 disabled:opacity-0"
                        aria-label="Scroll left"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                )}

                {/* Right Arrow */}
                {showRightArrow && (
                    <button
                        onClick={() => scroll('right')}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/90 backdrop-blur-sm border border-slate-200 shadow-lg rounded-full text-slate-700 hover:text-indigo-600 hover:border-indigo-100 transition-all -mr-3 opacity-0 group-hover/section:opacity-100 duration-300"
                        aria-label="Scroll right"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                )}

                {/* Scroll Container */}
                <div
                    ref={scrollContainerRef}
                    onScroll={checkScroll}
                    className="overflow-x-auto scrollbar-hide pb-4 px-4 sm:px-8 scroll-smooth"
                >
                    {/* Dynamic Grid Rows: 1 row if <= 5 items, 2 if <= 10, 3 if > 10 */}
                    <div className={`grid gap-4 w-max ${products.length <= 5 ? 'grid-rows-1' :
                        products.length <= 10 ? 'grid-rows-2' :
                            'grid-rows-3'
                        } grid-flow-col ${products.length < 5 ? 'mx-0' : ''}`}>
                        {products.map((product) => (
                            <div key={product.id} className="w-[160px] sm:w-[200px]">
                                <ProductCard product={product} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
