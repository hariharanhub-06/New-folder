"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from './types';

export interface CartItem extends Product {
    quantity: number;
    selectedSize?: string;
}

interface CartContextType {
    items: CartItem[];
    addToCart: (product: Product, size?: string) => void;
    decrementFromCart: (productId: string, size?: string) => void;
    removeFromCart: (productId: string, size?: string) => void;
    clearCart: () => void;
    total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load cart from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem('cart');
        if (saved) {
            setItems(JSON.parse(saved));
        }
        setIsLoaded(true);
    }, []);

    // Save cart to local storage on change
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('cart', JSON.stringify(items));
        }
    }, [items, isLoaded]);

    const addToCart = (product: Product, size?: string) => {
        setItems(current => {
            const existing = current.find(item => item.id === product.id && item.selectedSize === size);
            if (existing) {
                return current.map(item =>
                    (item.id === product.id && item.selectedSize === size)
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...current, { ...product, quantity: 1, selectedSize: size }];
        });
    };

    const decrementFromCart = (productId: string, size?: string) => {
        setItems(current => {
            const existing = current.find(item => item.id === productId && item.selectedSize === size);
            if (existing && existing.quantity > 1) {
                return current.map(item =>
                    (item.id === productId && item.selectedSize === size)
                        ? { ...item, quantity: item.quantity - 1 }
                        : item
                );
            }
            if (existing && existing.quantity === 1) {
                return current.filter(item => !(item.id === productId && item.selectedSize === size));
            }
            return current;
        });
    };

    const removeFromCart = (productId: string, size?: string) => {
        setItems(current => current.filter(item => !(item.id === productId && item.selectedSize === size)));
    };

    const clearCart = () => setItems([]);

    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <CartContext.Provider value={{ items, addToCart, decrementFromCart, removeFromCart, clearCart, total }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
