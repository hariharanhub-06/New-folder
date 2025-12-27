"use client";
import { Star, Loader2 } from 'lucide-react';
import { toggleProductTrending } from '@/lib/actions';
import { useState } from 'react';

export default function ToggleTrendingButton({ id, isTrending, onToggle }: { id: string, isTrending: boolean, onToggle: () => void }) {
    const [isLoading, setIsLoading] = useState(false);

    const handleToggle = async () => {
        setIsLoading(true);
        try {
            await toggleProductTrending(id);
            onToggle();
        } catch (error) {
            console.error("Failed to toggle trending", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleToggle}
            disabled={isLoading}
            className={`p-1.5 rounded-full transition-colors ${isTrending ? 'bg-yellow-100 text-yellow-600' : 'text-gray-400 hover:bg-yellow-50 hover:text-yellow-600'}`}
            title={isTrending ? "Remove from Offer Drops" : "Add to Offer Drops"}
        >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Star className={`w-5 h-5 ${isTrending ? 'fill-current' : ''}`} />}
        </button>
    );
}
