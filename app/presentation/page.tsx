
"use client";

import { useState, useEffect } from 'react';
import SceneIntro from '@/components/presentation/SceneIntro';
import SceneTechStack from '@/components/presentation/SceneTechStack';
import SceneInfra from '@/components/presentation/SceneInfra';
import SceneFeatures from '@/components/presentation/SceneFeatures';
import SceneConclusion from '@/components/presentation/SceneConclusion';
import { ArrowRight, ArrowLeft } from 'lucide-react';

export default function PresentationPage() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const slides = [
        <SceneIntro key="intro" />,
        <SceneTechStack key="tech" />,
        <SceneInfra key="infra" />,
        <SceneFeatures key="features" />,
        <SceneConclusion key="conclusion" />
    ];

    // Optional: Auto-advance for recording (can be disabled)
    // useEffect(() => {
    //     const timer = setInterval(() => {
    //         if (currentSlide < slides.length - 1) {
    //             setCurrentSlide(prev => prev + 1);
    //         }
    //     }, 5000);
    //     return () => clearInterval(timer);
    // }, [currentSlide, slides.length]);

    const nextSlide = () => {
        if (currentSlide < slides.length - 1) setCurrentSlide(currentSlide + 1);
    };

    const prevSlide = () => {
        if (currentSlide > 0) setCurrentSlide(currentSlide - 1);
    };

    return (
        <div className="h-screen w-full bg-slate-950 text-white overflow-hidden relative font-sans selection:bg-amber-500 selection:text-white">

            {/* Slide Render Area */}
            <div className="h-full w-full flex items-center justify-center">
                {slides[currentSlide]}
            </div>

            {/* Navigation Controls (Hidden in production video ideally, or small) */}
            <div className="absolute bottom-8 right-8 flex gap-4 z-50 opacity-20 hover:opacity-100 transition-opacity">
                <button
                    onClick={prevSlide}
                    className="p-3 bg-slate-800 rounded-full hover:bg-amber-500 hover:text-slate-900 transition-all"
                    disabled={currentSlide === 0}
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="flex items-center text-sm font-mono text-slate-500">
                    {currentSlide + 1} / {slides.length}
                </div>
                <button
                    onClick={nextSlide}
                    className="p-3 bg-slate-800 rounded-full hover:bg-amber-500 hover:text-slate-900 transition-all"
                    disabled={currentSlide === slides.length - 1}
                >
                    <ArrowRight className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
}
