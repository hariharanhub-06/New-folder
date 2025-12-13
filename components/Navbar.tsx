"use client";

import Link from 'next/link';
import { ShoppingCart, Menu, X } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Logo from './Logo';

export default function Navbar() {
    const { items } = useCart();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();
    const menuRef = useRef<HTMLDivElement>(null);

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

    // Hide navbar on admin pages
    if (pathname?.startsWith('/admin')) {
        return null;
    }

    return (
        <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50" ref={menuRef}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20">
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center gap-2 text-lg md:text-2xl font-bold text-white tracking-wider active:scale-95 transition-transform">
                            <Logo className="w-6 h-6 md:w-8 md:h-8" />
                            <span>STARTUP<span className="text-amber-500">MENSWEAR</span></span>
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link href="/" className="text-slate-300 hover:text-white transition-colors text-sm font-medium uppercase tracking-wide active:text-amber-500">Home</Link>
                        <Link href="/shop" className="text-slate-300 hover:text-white transition-colors text-sm font-medium uppercase tracking-wide active:text-amber-500">Shop</Link>
                        <Link href="/checkout" className="relative p-2 text-slate-300 hover:text-amber-500 transition-colors active:scale-90">
                            <ShoppingCart className="w-6 h-6" />
                            {items.length > 0 && (
                                <span className="absolute top-0 right-0 bg-amber-500 text-slate-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                    {items.reduce((a, b) => a + b.quantity, 0)}
                                </span>
                            )}
                        </Link>
                    </div>

                    {/* Mobile Menu Button & Cart */}
                    <div className="md:hidden flex items-center gap-4">
                        <Link href="/checkout" className="relative p-2 text-slate-300 hover:text-amber-500 transition-colors active:scale-90">
                            <ShoppingCart className="w-6 h-6" />
                            {items.length > 0 && (
                                <span className="absolute top-0 right-0 bg-amber-500 text-slate-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                    {items.reduce((a, b) => a + b.quantity, 0)}
                                </span>
                            )}
                        </Link>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-2 rounded-md text-slate-300 hover:text-white focus:outline-none active:scale-90 transition-transform"
                            aria-label="Toggle menu"
                        >
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-slate-800">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        <Link
                            href="/"
                            onClick={() => setIsMenuOpen(false)}
                            className="block px-3 py-2 text-base font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded-md active:bg-slate-600 active:text-amber-500 transition-colors"
                        >
                            Home
                        </Link>
                        <Link
                            href="/shop"
                            onClick={() => setIsMenuOpen(false)}
                            className="block px-3 py-2 text-base font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded-md active:bg-slate-600 active:text-amber-500 transition-colors"
                        >
                            Shop
                        </Link>
                        <Link
                            href="/checkout"
                            onClick={() => setIsMenuOpen(false)}
                            className="block px-3 py-2 text-base font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded-md active:bg-slate-600 active:text-amber-500 transition-colors"
                        >
                            Cart ({items.reduce((a, b) => a + b.quantity, 0)})
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
}
