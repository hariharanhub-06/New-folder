"use client";

import { toggleProductStatus } from "@/lib/actions";
import { Power } from "lucide-react";

export default function ToggleStatusButton({ id, isActive }: { id: string, isActive: boolean }) {
    return (
        <button
            onClick={() => toggleProductStatus(id)}
            className={`p-2 rounded-md transition-colors ${isActive
                    ? "text-green-600 hover:bg-green-50"
                    : "text-slate-400 hover:bg-slate-100"
                }`}
            title={isActive ? "Mark as Inactive" : "Mark as Active"}
        >
            <Power className="w-5 h-5" />
        </button>
    );
}
