"use client";

import Link from "next/link";
import { ArrowRight, Zap, ShieldCheck, Truck, MapPin } from "lucide-react";
import Image from "next/image";
import { UnifrakturMaguntia } from "next/font/google";
import { useEffect, useState, useRef } from "react";
import { getFullCategories, getSettings } from "@/lib/api";

const gothic = UnifrakturMaguntia({
    weight: "400",
    subsets: ["latin"],
});

export default function HomePage() {
    const [categories, setCategories] = useState<any[]>([]);
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [isAutoScrolling, setIsAutoScrolling] = useState(true);
    const categoryScrollRef = useRef<HTMLDivElement>(null);
    const scrollPauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleUserInteraction = () => {
        setIsAutoScrolling(false);
        if (scrollPauseTimeoutRef.current) {
            clearTimeout(scrollPauseTimeoutRef.current);
        }
        scrollPauseTimeoutRef.current = setTimeout(() => {
            setIsAutoScrolling(true);
        }, 4000);
    };

    useEffect(() => {
        async function loadData() {
            try {
                const [cats, sets] = await Promise.all([
                    getFullCategories(),
                    getSettings()
                ]);
                // Filter active categories and take top 4 or all? 
                // Let's show all active categories in a grid
                // User Request: "In the front page catergories only hoodie should be visible no other products"
                setCategories(cats.filter(c => c.is_active && c.name.toLowerCase().includes('hoodie')));
                setSettings(sets);
            } catch (err) {
                console.error("Failed to load homepage data", err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    useEffect(() => {
        if (!categories.length || !categoryScrollRef.current || !isAutoScrolling) return;

        const scrollInterval = setInterval(() => {
            if (categoryScrollRef.current) {
                const { scrollLeft, scrollWidth, clientWidth } = categoryScrollRef.current;
                if (scrollLeft + clientWidth >= scrollWidth - 10) {
                    categoryScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    categoryScrollRef.current.scrollBy({ left: 350, behavior: 'smooth' });
                }
            }
        }, 1000);

        return () => clearInterval(scrollInterval);
    }, [categories.length, isAutoScrolling]);

    return (
        <div className="min-h-screen bg-[#F4F3EF] font-jost text-black">
            {/* Hero Section: High Contrast & Energy */}
            <section className="relative h-[90vh] flex items-center justify-center bg-black overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
                    {settings.hero_use_map === 'true' && settings.map_embed_url ? (
                        <iframe
                            src={settings.map_embed_url}
                            width="100%"
                            height="100%"
                            style={{ border: 0, opacity: 0.4 }}
                            allowFullScreen
                            loading="lazy"
                        />
                    ) : (
                        <Image
                            src={settings.hero_image_url || "/streetwear_hero_bg.png"}
                            alt="Hero Background"
                            fill
                            className="object-cover opacity-60"
                            priority
                            unoptimized={!!settings.hero_image_url?.startsWith('http')}
                        />
                    )}
                </div>

                <div className="relative z-20 container mx-auto px-4 text-center">
                    <div className="inline-block mb-6 px-6 py-2 bg-brand-red text-white text-[10px] md:text-xs font-bold uppercase tracking-[0.4em] shadow-[0_0_20px_rgba(214,30,38,0.5)]">
                        New Season Drop
                    </div>
                    <h1 className={`${gothic.className} text-7xl md:text-9xl text-white mb-2 leading-none drop-shadow-2xl`}>
                        {settings.hero_title || "Startup"}
                    </h1>
                    <div className="text-xl md:text-3xl text-white font-bold uppercase tracking-[0.5em] mb-12 opacity-90">
                        {settings.hero_subtitle || "Menswear"}
                    </div>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                        <Link
                            href="/shop"
                            className="w-full md:w-auto px-12 py-5 bg-brand-red text-white font-bold uppercase tracking-widest text-sm hover:scale-105 transition-transform shadow-[0_0_30px_rgba(214,30,38,0.3)]"
                        >
                            Shop Collection
                        </Link>
                        <Link
                            href="/shop?isTrending=true"
                            className="w-full md:w-auto px-12 py-5 bg-white text-black font-bold uppercase tracking-widest text-sm hover:invert transition-all"
                        >
                            Trending Now
                        </Link>
                    </div>
                </div>

                <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:block text-white/10 [writing-mode:vertical-lr] text-9xl font-black uppercase tracking-tighter select-none">
                    STREETWEAR
                </div>
            </section>

            {/* Featured Categories: Horizontal Carousel */}
            <section className="py-20 container mx-auto px-4">
                <div className="flex items-center justify-between mb-10">
                    <h2 className="text-3xl font-black uppercase tracking-tighter italic">Featured <span className="text-brand-red">Drops</span></h2>
                    <Link href="/shop" className="text-xs font-bold uppercase tracking-widest border-b-2 border-black hover:text-brand-red hover:border-brand-red transition-all">View All</Link>
                </div>
                <div className="relative overflow-hidden group">
                    <div
                        ref={categoryScrollRef}
                        onWheel={handleUserInteraction}
                        onTouchStart={handleUserInteraction}
                        onPointerDown={handleUserInteraction}
                        className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory"
                        id="category-carousel"
                    >
                        {categories.map((cat, idx) => (
                            <div key={idx} className="min-w-[280px] md:min-w-[320px] lg:min-w-[350px] snap-center">
                                <CategoryCard title={cat.name} category={cat.id || cat.name} img={cat.image_url} />
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => {
                            const el = document.getElementById('category-carousel');
                            if (el) el.scrollLeft -= 350;
                        }}
                        className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/50 text-white p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10 hidden md:block"
                    >
                        &lt;
                    </button>
                    <button
                        onClick={() => {
                            const el = document.getElementById('category-carousel');
                            if (el) el.scrollLeft += 350;
                        }}
                        className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/50 text-white p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10 hidden md:block"
                    >
                        &gt;
                    </button>
                </div>

                <style jsx global>{`
                    .no-scrollbar::-webkit-scrollbar {
                        display: none;
                    }
                    .no-scrollbar {
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                    }
                `}</style>
            </section>

            {/* Brand Pillars */}
            <section className="bg-black text-white py-16 border-y border-gray-800">
                <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                    <div className="flex flex-col items-center">
                        <Zap className="w-10 h-10 text-brand-red mb-4" />
                        <h3 className="text-lg font-bold uppercase tracking-widest mb-2">Lightspeed Delivery</h3>
                        <p className="text-xs text-gray-500 uppercase tracking-widest">Global shipping in 4-6 days</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <ShieldCheck className="w-10 h-10 text-brand-red mb-4" />
                        <h3 className="text-lg font-bold uppercase tracking-widest mb-2">Elite Quality</h3>
                        <p className="text-xs text-gray-500 uppercase tracking-widest">Strictly premium battle-tested gear</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <Truck className="w-10 h-10 text-brand-red mb-4" />
                        <h3 className="text-lg font-bold uppercase tracking-widest mb-2">100% Trusted Service</h3>
                        <p className="text-xs text-gray-500 uppercase tracking-widest">We Build Trust</p>
                    </div>
                </div>
            </section>

            {/* Map Section: Local Presence */}
            <section className="py-24 bg-white overflow-hidden">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="lg:w-1/3">
                            <div className="inline-block mb-4 px-4 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-widest">Our HQ</div>
                            <h2 className={`${gothic.className} text-6xl mb-6`}>Visit The Studio</h2>
                            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-8 leading-loose">
                                Experience the quality in person. Our flagship studio is open for fits and exclusive in-store drops.
                            </p>

                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <MapPin className="w-5 h-5 text-brand-red shrink-0" />
                                    <div className="text-xs font-bold uppercase tracking-widest leading-relaxed">
                                        {settings.contact_address || '160/1, CAR ST, SOWRIPALAYAM, COIMBATORE'}
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <Truck className="w-5 h-5 text-brand-red shrink-0" />
                                    <div className="text-xs font-bold uppercase tracking-widest">
                                        Open Mon-Sat: 10AM - 9PM
                                    </div>
                                </div>
                                <Link
                                    href="https://www.google.com/maps/search/?api=1&query=Startup+mens+wear+Coimbatore"
                                    target="_blank"
                                    className="inline-flex items-center gap-2 mt-4 px-8 py-4 bg-black text-white text-[10px] font-bold uppercase tracking-widest hover:bg-brand-red transition-all"
                                >
                                    Get Directions <ArrowRight className="w-3 h-3" />
                                </Link>
                            </div>
                        </div>

                        <div className="lg:w-2/3 w-full h-[500px] border-8 border-black shadow-2xl relative">
                            {settings.map_embed_url ? (
                                <iframe
                                    src={settings.map_embed_url}
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 uppercase tracking-[0.3em] font-bold">Map Preview</div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

function CategoryCard({ title, category, img }: { title: string, category: string, img: string }) {
    const href = category.includes('?') ? `/shop${category.replace('all', '')}` : `/shop?category=${category}`;
    const safeImg = img || "https://images.unsplash.com/photo-1552066344-24632e509613?q=80&w=1000&auto=format&fit=crop";
    return (
        <Link href={href} className="group relative aspect-[3/4] overflow-hidden bg-gray-100 block">
            <Image
                src={safeImg}
                alt={title}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                unoptimized={safeImg.startsWith('http')}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
            <div className="absolute bottom-6 left-6 text-white w-[calc(100%-48px)]">
                <h3 className="text-2xl font-bold uppercase tracking-tighter leading-none mb-2 drop-shadow-md">{title}</h3>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 text-brand-red">
                    Shop Now <ArrowRight className="w-3 h-3" />
                </div>
            </div>
        </Link>
    );
}
