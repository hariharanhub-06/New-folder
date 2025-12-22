
"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

export default function SceneConclusion() {
    return (
        <div className="w-full h-full bg-black flex flex-col items-center justify-center relative overflow-hidden">

            <div className="absolute inset-0 bg-gradient-to-t from-amber-900/20 to-transparent" />

            <div className="z-10 text-center animate-in fade-in zoom-in duration-1000">
                <h1 className="text-7xl font-bold mb-8">Ready to Scale?</h1>

                <div className="flex items-center justify-center gap-4 text-2xl text-slate-300">
                    <span className="flex items-center gap-2"><CheckCircle2 className="text-amber-500" /> Fast</span>
                    <span className="flex items-center gap-2"><CheckCircle2 className="text-amber-500" /> Secure</span>
                    <span className="flex items-center gap-2"><CheckCircle2 className="text-amber-500" /> Modern</span>
                </div>

                <div className="mt-20">
                    <p className="text-sm text-slate-500 uppercase tracking-[0.5em] animate-pulse">Startup Men&apos;s Wear</p>
                </div>
            </div>
        </div>
    );
}
