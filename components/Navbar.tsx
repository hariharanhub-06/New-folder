"use client";

import Link from 'next/link';
import { ShoppingCart, Menu, X, Search, Heart } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { useState, useEffect, useRef } from 'react';
import { getSettings } from '@/lib/api';
import { usePathname } from 'next/navigation';
import { UnifrakturMaguntia } from "next/font/google";

const gothic = UnifrakturMaguntia({
    weight: "400",
    subsets: ["latin"],
});

export default function Navbar() {
    const { items, total } = useCart();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [announcement, setAnnouncement] = useState('SPECIAL OFFER: ENJOY 40% OFF ON TWO HOT-SELLING PRODUCTS! SHOP NOW');
    const pathname = usePathname();
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        async function loadSettings() {
            try {
                const settings = await getSettings();
                if (settings.announcement_text) setAnnouncement(settings.announcement_text);
            } catch (err) {
                console.error("Failed to load settings in Navbar", err);
            }
        }
        loadSettings();
    }, []);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        }

        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen]);

    if (pathname?.startsWith('/admin')) {
        return null;
    }

    const cartCount = items.reduce((a, b) => a + b.quantity, 0);

    return (
        <nav className="w-full z-50 sticky top-0 font-jost" ref={menuRef}>
            {/* Tier 1: Announcement Bar */}
            <div className="w-full bg-slate-900 text-white py-2 px-4 text-center text-[10px] md:text-sm font-medium tracking-widest uppercase">
                {announcement} <Link href="/shop" className="underline hover:text-brand-red transition-colors ml-2">SHOP NOW</Link>
            </div>

            {/* Tier 2: Main Header (Logo, Search, Icons) */}
            <div className="bg-white border-b border-gray-100 py-4 md:py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">

                    {/* Left: Search Bar (Desktop) */}
                    <div className="hidden md:flex flex-1 items-center max-w-xs">
                        <div className="relative w-full">
                            <input
                                type="text"
                                placeholder="Search products..."
                                className="w-full bg-gray-100 border-none rounded-sm py-2 pl-4 pr-10 text-sm focus:ring-1 focus:ring-gray-300 outline-none"
                            />
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        </div>
                    </div>

                    {/* Center: Brand Logo */}
                    <div className="flex-1 flex justify-center">
                        <Link href="/" className="group flex flex-col items-center">
                            <span className={`${gothic.className} text-4xl md:text-5xl text-black tracking-normal leading-none group-active:scale-95 transition-transform`}>
                                Startup
                            </span>
                            <span className="text-[8px] md:text-[10px] font-bold tracking-[0.3em] uppercase text-gray-400 -mt-1">
                                Menswear
                            </span>
                        </Link>
                    </div>

                    {/* Right: Icons (Cart, Account) */}
                    <div className="flex-1 flex items-center justify-end gap-3 md:gap-6">
                        {/* Mobile Search/Menu Toggle (Left on mobile, but here for order) */}
                        <div className="md:hidden flex items-center gap-4 mr-auto">
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1">
                                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>

                        <div className="flex items-center gap-3 md:gap-5">
                            <Link href="/wishlist" className="relative p-1 hover:text-brand-red transition-colors">
                                <Heart className="w-5 h-5" />
                                <span className="absolute -top-1 -right-1 bg-brand-red text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">0</span>
                            </Link>
                            <Link href="/checkout" className="relative p-1 hover:text-brand-red transition-colors flex items-center gap-2">
                                <div className="relative">
                                    <ShoppingCart className="w-6 h-6" />
                                    {mounted && cartCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-brand-red text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
                                            {cartCount}
                                        </span>
                                    )}
                                </div>
                                <div className="hidden md:flex flex-col leading-none">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">My Cart</span>
                                    {mounted && <span className="text-sm font-bold">₹{total.toFixed(2)}</span>}
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tier 3: Category Navigation (Desktop) */}
            <div className="bg-white border-b border-gray-100 hidden md:block">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-center space-x-12 py-3">
                        <Link href="/shop" className="group flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:text-brand-red transition-colors">
                            <Menu className="w-4 h-4" />
                            Shop By Categories
                        </Link>
                        <Link href="/shop?isNewArrival=true" className="text-xs font-bold uppercase tracking-widest hover:text-brand-red transition-colors">New Arrivals</Link>
                        <Link href="/shop?isTrending=true" className="text-xs font-bold uppercase tracking-widest hover:text-brand-red transition-colors">Trending Now</Link>
                        <Link href="/shop?category=Pant" className="text-xs font-bold uppercase tracking-widest hover:text-brand-red transition-colors">Bottoms</Link>
                        <Link href="/shop?category=Hoodie" className="text-xs font-bold uppercase tracking-widest hover:text-brand-red transition-colors">Hoodies</Link>
                        <Link href="/shop?category=T-Shirt" className="text-xs font-bold uppercase tracking-widest hover:text-brand-red transition-colors">T-Shirts</Link>
                        <Link href="/shop?category=Shirt" className="text-xs font-bold uppercase tracking-widest hover:text-brand-red transition-colors">Shirts</Link>
                        <Link href="/shop?isOffer=true" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-red hover:opacity-80 transition-opacity">
                            <Tag className="w-4 h-4" />
                            Best Offers
                        </Link>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div className="md:hidden fixed inset-0 z-[60] bg-white pt-20">
                    <div className="px-6 py-8 space-y-6">
                        <div className="relative mb-8">
                            <input
                                type="text"
                                placeholder="Search products..."
                                className="w-full bg-gray-100 border-none rounded-lg py-3 pl-4 pr-10 text-base focus:ring-1 focus:ring-brand-red outline-none"
                            />
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        </div>
                        <Link href="/shop?isNewArrival=true" onClick={() => setIsMenuOpen(false)} className="block text-lg font-bold uppercase tracking-wider border-b border-gray-100 pb-4">New Arrivals</Link>
                        <Link href="/shop" onClick={() => setIsMenuOpen(false)} className="block text-lg font-bold uppercase tracking-wider border-b border-gray-100 pb-4">Trending Now</Link>
                        <Link href="/shop" onClick={() => setIsMenuOpen(false)} className="block text-lg font-bold uppercase tracking-wider border-b border-gray-100 pb-4">Shop By Category</Link>
                        <Link href="/shop?isOffer=true" onClick={() => setIsMenuOpen(false)} className="block text-lg font-bold uppercase tracking-wider text-brand-red">Best Offers</Link>
                    </div>
                    <button onClick={() => setIsMenuOpen(false)} className="absolute top-6 right-6 p-2">
                        <X className="w-8 h-8" />
                    </button>
                </div>
            )}
        </nav>
    );
}

// Helper icons missing or need imports
function Tag({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" /><circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
        </svg>
    );
}
