"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Product } from './types';

interface WishlistContextType {
    items: Product[];
    addToWishlist: (product: Product) => void;
    removeFromWishlist: (productId: string) => void;
    isInWishlist: (productId: string) => boolean;
    toggleWishlist: (product: Product) => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<Product[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem('wishlist');
        if (stored) {
            try {
                setItems(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse wishlist", e);
            }
        }
    }, []);

    useEffect(() => {
        if (mounted) {
            localStorage.setItem('wishlist', JSON.stringify(items));
        }
    }, [items, mounted]);

    const addToWishlist = (product: Product) => {
        console.log("Adding to wishlist:", product.name);
        setItems(prev => {
            if (prev.some(item => item.id === product.id)) return prev;
            return [...prev, product];
        });
    };

    const removeFromWishlist = (productId: string) => {
        console.log("Removing from wishlist:", productId);
        setItems(prev => prev.filter(item => item.id !== productId));
    };

    const isInWishlist = (productId: string) => {
        return items.some(item => item.id === productId);
    };

    const toggleWishlist = (product: Product) => {
        console.log("Toggling wishlist for:", product.name);
        if (isInWishlist(product.id)) {
            removeFromWishlist(product.id);
        } else {
            addToWishlist(product);
        }
    };

    return (
        <WishlistContext.Provider value={{ items, addToWishlist, removeFromWishlist, isInWishlist, toggleWishlist }}>
            {children}
        </WishlistContext.Provider>
    );
}

export function useWishlist() {
    const context = useContext(WishlistContext);
    if (context === undefined) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
}
