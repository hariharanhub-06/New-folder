
"use client";

import { useEffect, useState } from "react";
import { Code2, FileCode, Wind } from "lucide-react";

export default function SceneTechStack() {
    const [step, setStep] = useState(0);

    useEffect(() => {
        setTimeout(() => setStep(1), 500); // Title
        setTimeout(() => setStep(2), 1500); // Next
        setTimeout(() => setStep(3), 2500); // TS
        setTimeout(() => setStep(4), 3500); // Tailwind
    }, []);

    const Item = ({ icon: Icon, title, desc, delay, show, color }: any) => (
        <div className={`flex flex-col items-center transition-all duration-700 transform ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
            <div className={`w-32 h-32 rounded-3xl flex items-center justify-center shadow-2xl mb-6 ${color}`}>
                <Icon className="w-16 h-16 text-white" />
            </div>
            <h3 className="text-3xl font-bold mb-2">{title}</h3>
            <p className="text-slate-400">{desc}</p>
        </div>
    );

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 relative overflow-hidden">
            {/* Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            <h2 className={`text-5xl font-bold mb-20 z-10 transition-all duration-500 ${step >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5'}`}>
                The Tech Stack
            </h2>

            <div className="flex gap-20 z-10">
                <Item
                    icon={Code2}
                    title="Next.js 14"
                    desc="App Router & SSR"
                    show={step >= 2}
                    color="bg-black border border-slate-800"
                />
                <Item
                    icon={FileCode}
                    title="TypeScript"
                    desc="Type Safety"
                    show={step >= 3}
                    color="bg-blue-600"
                />
                <Item
                    icon={Wind}
                    title="Tailwind CSS"
                    desc="Rapid Styling"
                    show={step >= 4}
                    color="bg-cyan-500"
                />
            </div>
        </div>
    );
}
