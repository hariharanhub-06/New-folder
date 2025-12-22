"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, Check, Loader2 } from 'lucide-react';

interface SwipeToPayButtonProps {
    amount: number;
    onSwipeComplete: () => Promise<void>;
    isLoading?: boolean;
    disabled?: boolean;
}

export default function SwipeToPayButton({ amount, onSwipeComplete, isLoading = false, disabled = false }: SwipeToPayButtonProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [dragX, setDragX] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const sliderRef = useRef<HTMLDivElement>(null);

    const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
        if (isLoading || disabled || isCompleted) return;
        setIsDragging(true);
    };

    const handleDragEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);

        const threshold = containerRef.current ? containerRef.current.clientWidth * 0.7 : 0; // Lowered to 70%
        console.log(`[Swipe] Drag End: dragX=${dragX}, threshold=${threshold}, containerWidth=${containerRef.current?.clientWidth}`);

        if (containerRef.current && dragX > threshold) {
            // Swipe completed
            console.log('[Swipe] ✅ Completed! Calling onSwipeComplete');
            setDragX(containerRef.current.clientWidth - (sliderRef.current?.clientWidth || 0));
            setIsCompleted(true);
            onSwipeComplete();
        } else {
            // Reset position
            console.log('[Swipe] ❌ Not enough - Resetting');
            setDragX(0);
        }
    };

    const handleClick = () => {
        console.log('[Swipe] Button clicked', { isLoading, disabled, isCompleted });
        if (isLoading || disabled || isCompleted) {
            console.log('[Swipe] Button is disabled, not triggering payment');
            return;
        }
        console.log('[Swipe] Button clicked - triggering payment');
        setIsCompleted(true);
        onSwipeComplete();
    };

    const handleDrag = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging || !containerRef.current || !sliderRef.current) return;

        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const containerRect = containerRef.current.getBoundingClientRect();
        const maxDrag = containerRef.current.clientWidth - sliderRef.current.clientWidth;

        let newX = clientX - containerRect.left;
        newX = Math.max(0, Math.min(newX, maxDrag));

        setDragX(newX);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mouseup', handleDragEnd);
            window.addEventListener('touchend', handleDragEnd);
            window.addEventListener('mousemove', handleDrag as any);
            window.addEventListener('touchmove', handleDrag as any);
        } else {
            window.removeEventListener('mouseup', handleDragEnd);
            window.removeEventListener('touchend', handleDragEnd);
            window.removeEventListener('mousemove', handleDrag as any);
            window.removeEventListener('touchmove', handleDrag as any);
        }
        return () => {
            window.removeEventListener('mouseup', handleDragEnd);
            window.removeEventListener('touchend', handleDragEnd);
            window.removeEventListener('mousemove', handleDrag as any);
            window.removeEventListener('touchmove', handleDrag as any);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDragging]);

    return (
        <div className="w-full max-w-md mx-auto">
            <div
                ref={containerRef}
                onDoubleClick={handleClick}
                className={`relative h-16 rounded-full overflow-hidden select-none transition-colors duration-300 ${isCompleted ? 'bg-green-500' : 'bg-slate-900'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
                {/* Background Text */}
                <div className="absolute inset-0 flex items-center justify-center text-white font-medium z-0">
                    {isCompleted ? (
                        <span className="flex items-center gap-2">
                            <Check className="w-5 h-5" />
                            Payment Initiated
                        </span>
                    ) : isLoading ? (
                        <span className="flex items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Processing...
                        </span>
                    ) : (
                        <span className="opacity-90 animate-pulse">
                            Swipe to Pay ₹{amount.toFixed(2)}
                        </span>
                    )}
                </div>

                {/* Slider Button */}
                <div
                    ref={sliderRef}
                    onMouseDown={handleDragStart}
                    onTouchStart={handleDragStart}
                    style={{ transform: `translateX(${dragX}px)` }}
                    className={`absolute left-1 top-1 bottom-1 w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center z-10 transition-transform duration-75 ${!isDragging && !isCompleted ? 'transition-all duration-300' : ''
                        }`}
                >
                    <div className="text-slate-900">
                        {isLoading ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : isCompleted ? (
                            <Check className="w-6 h-6 text-green-600" />
                        ) : (
                            <ChevronRight className="w-6 h-6" />
                        )}
                    </div>
                </div>

                {/* Progress Overlay */}
                <div
                    className="absolute inset-y-0 left-0 bg-white/20 z-0 pointer-events-none"
                    style={{ width: sliderRef.current ? dragX + sliderRef.current.clientWidth / 2 : 0 }}
                />
            </div>
        </div>
    );
}
