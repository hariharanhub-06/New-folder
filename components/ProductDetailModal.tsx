"use client";

import { useState, useEffect } from 'react';
import { Product } from '@/lib/types';
import { ArrowLeft } from 'lucide-react';
import ProductDetail from './ProductDetail';

interface ProductDetailModalProps {
    product: Product;
    onClose: () => void;
}

export default function ProductDetailModal({ product: initialProduct, onClose }: ProductDetailModalProps) {
    useEffect(() => {
        // Lock body scroll while modal is open
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="relative w-full max-w-6xl animate-in fade-in zoom-in duration-300 z-10">
                <ProductDetail
                    product={initialProduct}
                    isModal={true}
                    onClose={onClose}
                />
            </div>
        </div>
    );
}
