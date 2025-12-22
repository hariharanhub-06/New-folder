
"use client";

import { useEffect, useState } from "react";
import { Cloud, Database, Globe, Image as ImageIcon } from "lucide-react";

export default function SceneInfra() {
    const [step, setStep] = useState(0);

    useEffect(() => {
        setTimeout(() => setStep(1), 500); // Center Cloud
        setTimeout(() => setStep(2), 1500); // Branches
    }, []);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 relative">
            <h2 className="absolute top-20 text-4xl font-bold text-slate-500 uppercase tracking-widest">Infrastructure</h2>

            <div className="relative w-[800px] h-[500px] flex items-center justify-center">

                {/* Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: step >= 2 ? 1 : 0, transition: 'opacity 1s' }}>
                    {/* Center to Top (Vercel) */}
                    <line x1="400" y1="250" x2="400" y2="100" stroke="#f59e0b" strokeWidth="4" strokeDasharray="10 5" className="animate-pulse" />
                    {/* Center to Bottom Left (Neon) */}
                    <line x1="400" y1="250" x2="150" y2="400" stroke="#3b82f6" strokeWidth="4" strokeDasharray="10 5" className="animate-pulse" />
                    {/* Center to Bottom Right (ImageKit) */}
                    <line x1="400" y1="250" x2="650" y2="400" stroke="#ec4899" strokeWidth="4" strokeDasharray="10 5" className="animate-pulse" />
                </svg>

                {/* Vercel */}
                <div className={`absolute top-0 transition-all duration-700 transform ${step >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
                    <div className="flex flex-col items-center">
                        <div className="w-24 h-24 bg-black rounded-full border-4 border-white flex items-center justify-center mb-4">
                            <Globe className="w-10 h-10 text-white" />
                        </div>
                        <div className="bg-slate-800 px-6 py-3 rounded-lg border border-slate-700">
                            <h3 className="text-xl font-bold">Vercel</h3>
                            <p className="text-xs text-slate-400">Edge Network</p>
                        </div>
                    </div>
                </div>

                {/* Main Cloud */}
                <div className={`z-10 transition-all duration-700 transform ${step >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}>
                    <div className="w-40 h-40 bg-slate-800 rounded-full flex items-center justify-center shadow-[0_0_100px_rgba(255,255,255,0.1)] border border-slate-700">
                        <Cloud className="w-20 h-20 text-slate-200" />
                    </div>
                </div>

                {/* Neon */}
                <div className={`absolute bottom-0 left-0 transition-all duration-700 delay-300 transform ${step >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    <div className="flex flex-col items-center">
                        <div className="w-24 h-24 bg-[#00e599] rounded-full flex items-center justify-center mb-4 shadow-lg">
                            <Database className="w-10 h-10 text-black" />
                        </div>
                        <div className="bg-slate-800 px-6 py-3 rounded-lg border border-slate-700">
                            <h3 className="text-xl font-bold text-[#00e599]">Neon</h3>
                            <p className="text-xs text-slate-400">Serverless Postgres</p>
                        </div>
                    </div>
                </div>

                {/* ImageKit */}
                <div className={`absolute bottom-0 right-0 transition-all duration-700 delay-500 transform ${step >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    <div className="flex flex-col items-center">
                        <div className="w-24 h-24 bg-pink-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
                            <ImageIcon className="w-10 h-10 text-white" />
                        </div>
                        <div className="bg-slate-800 px-6 py-3 rounded-lg border border-slate-700">
                            <h3 className="text-xl font-bold text-pink-500">ImageKit</h3>
                            <p className="text-xs text-slate-400">CDN Storage</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
