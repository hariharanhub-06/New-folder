"use client";
import { Star, Loader2 } from 'lucide-react';
import { toggleProductOffer } from '@/lib/actions';
import { useState } from 'react';

export default function ToggleOfferButton({ id, isOffer, onToggle }: { id: string, isOffer: boolean, onToggle: () => void }) {
    const [isLoading, setIsLoading] = useState(false);

    const handleToggle = async () => {
        setIsLoading(true);
        try {
            await toggleProductOffer(id);
            onToggle();
        } catch (error) {
            console.error("Failed to toggle offer", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleToggle}
            disabled={isLoading}
            className={`p-1.5 rounded-full transition-colors ${isOffer ? 'bg-yellow-100 text-yellow-600' : 'text-gray-400 hover:bg-yellow-50 hover:text-yellow-600'}`}
            title={isOffer ? "Remove from Offers" : "Mark as Offer Product"}
        >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Star className={`w-5 h-5 ${isOffer ? 'fill-current' : ''}`} />}
        </button>
    );
}
