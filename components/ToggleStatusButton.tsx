"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleProductStatus } from "@/lib/actions";
import { Power } from "lucide-react";

interface ToggleStatusButtonProps {
    id: string;
    isActive: boolean;
    onToggle?: () => void;
}

export default function ToggleStatusButton({ id, isActive, onToggle }: ToggleStatusButtonProps) {
    const [isUpdating, setIsUpdating] = useState(false);
    const router = useRouter();

    const handleToggle = async () => {
        setIsUpdating(true);
        try {
            await toggleProductStatus(id);
            if (onToggle) {
                onToggle();
            } else {
                router.refresh();
            }
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('Failed to update status');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <button
            onClick={handleToggle}
            disabled={isUpdating}
            className={`p-2 rounded-md transition-colors ${isActive
                    ? "text-green-600 hover:bg-green-50"
                    : "text-slate-400 hover:bg-slate-100"
                } ${isUpdating ? "opacity-50 cursor-not-allowed" : ""} `}
            title={isActive ? "Mark as Inactive" : "Mark as Active"}
        >
            <Power className="w-5 h-5" />
        </button>
    );
}
