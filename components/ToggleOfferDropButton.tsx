"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface ToggleOfferDropButtonProps {
    productId: string;
    currentStatus: boolean;
}

export default function ToggleOfferDropButton({ productId, currentStatus }: ToggleOfferDropButtonProps) {
    const [isOfferDrop, setIsOfferDrop] = useState(currentStatus);
    const [loading, setLoading] = useState(false);

    const handleToggle = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/products/${productId}/toggle-offer-drop`, {
                method: "POST"
            });
            if (response.ok) {
                setIsOfferDrop(!isOfferDrop);
            }
        } catch (error) {
            console.error("Failed to toggle offer drop status", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button onClick={handleToggle} disabled={loading} title={isOfferDrop ? "Remove from Offer Drops" : "Add to Offer Drops"}>
            <Star className={`w-5 h-5 ${isOfferDrop ? "fill-yellow-400 text-yellow-400" : "text-gray-400"}`} />
        </button>
    );
}
