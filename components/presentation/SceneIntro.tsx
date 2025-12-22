
"use client";

import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";

export default function SceneIntro() {
    const [showText, setShowText] = useState(false);

    useEffect(() => {
        setTimeout(() => setShowText(true), 1000);
    }, []);

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-black">
            {/* Background Effect */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center blur-sm transform scale-105 pointer-events-none" />

            {/* Content */}
            <div className="z-10 flex flex-col items-center">
                <div className="animate-bounce mb-8">
                    <div className="w-24 h-24 bg-amber-500 rounded-2xl flex items-center justify-center shadow-[0_0_50px_rgba(245,158,11,0.5)]">
                        <ShoppingBag className="w-12 h-12 text-slate-900" />
                    </div>
                </div>

                <h1 className={`text-6xl md:text-8xl font-black tracking-tighter transition-all duration-1000 transform ${showText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    STARTUP
                    <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent ml-4">
                        MENSWEAR
                    </span>
                </h1>

                <p className={`mt-6 text-2xl text-slate-400 max-w-2xl text-center font-light leading-relaxed transition-all duration-1000 delay-500 transform ${showText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    Start Your Engines. <br />
                    <span className="text-amber-500 font-medium">The High-Performance E-Commerce Experience.</span>
                </p>
            </div>
        </div>
    );
}
