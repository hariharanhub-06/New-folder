"use client";

import Link from "next/link";
import { ArrowRight, Zap, ShieldCheck, Truck, MapPin, Flame } from "lucide-react";
import Image from "next/image";
import { UnifrakturMaguntia } from "next/font/google";
import { useEffect, useState, useRef } from "react";
import { getFullCategories, getSettings, getProductsPaginated } from "@/lib/api";
import { Product } from "@/lib/types";
import ProductCarousel from "@/components/ProductCarousel";
import ProductDetailModal from "@/components/ProductDetailModal";
import ProductCard from "@/components/ProductCard";
import ShopCategoryCircles from "@/components/ShopCategoryCircles";

const gothic = UnifrakturMaguntia({
    weight: "400",
    subsets: ["latin"],
});

export default function HomePage() {
    const [categories, setCategories] = useState<any[]>([]);
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
    const [newArrivalProducts, setNewArrivalProducts] = useState<Product[]>([]);
    const [bestOfferProducts, setBestOfferProducts] = useState<Product[]>([]);
    const [offerDropProducts, setOfferDropProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAutoScrolling, setIsAutoScrolling] = useState(true);
    const categoryScrollRef = useRef<HTMLDivElement>(null);
    const offerScrollRef = useRef<HTMLDivElement>(null);
    const scrollPauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Handle browser back button for modal
    useEffect(() => {
        const handlePopState = () => {
            if (selectedProduct) {
                setSelectedProduct(null);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [selectedProduct]);

    const handleProductSelect = (product: Product) => {
        setSelectedProduct(product);
        // Push a state so back button closes the modal
        window.history.pushState({ modalOpen: true }, '');
    };

    const handleModalClose = () => {
        setSelectedProduct(null);
        // If we opened a modal and pushed state, go back to clean it up
        if (window.history.state?.modalOpen) {
            window.history.back();
        }
    };

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
                const [cats, sets, trendingRes, newArrivalRes, bestOfferRes, offerDropRes] = await Promise.all([
                    getFullCategories(),
                    getSettings(),
                    getProductsPaginated({ isTrending: true, limit: 10, page: 1 }),
                    getProductsPaginated({ isNewArrival: true, limit: 10, page: 1 }),
                    getProductsPaginated({ isOffer: true, limit: 10, page: 1 }),
                    getProductsPaginated({ isOfferDrop: true, limit: 20, page: 1 })
                ]);
                setCategories(cats.filter(c => c.is_active));
                setSettings(sets);
                setTrendingProducts(trendingRes.data);
                setNewArrivalProducts(newArrivalRes.data);
                setBestOfferProducts(bestOfferRes.data);
                setOfferDropProducts(offerDropRes.data);
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
        }, 3000);

        return () => clearInterval(scrollInterval);
    }, [categories.length, isAutoScrolling]);

    // Auto-scroll logic for Offer Drops
    useEffect(() => {
        if (!offerDropProducts.length || !offerScrollRef.current || !isAutoScrolling) return;

        const scrollInterval = setInterval(() => {
            if (offerScrollRef.current) {
                const { scrollLeft, scrollWidth, clientWidth } = offerScrollRef.current;
                if (scrollLeft + clientWidth >= scrollWidth - 10) {
                    offerScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    const scrollAmount = 140; // Small card width + gap
                    offerScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                }
            }
        }, 1500);

        return () => clearInterval(scrollInterval);
    }, [offerDropProducts.length, isAutoScrolling]);

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

            {/* Offer Drops Section - Smaller size requested */}
            {!loading && offerDropProducts.length > 0 && (
                <section className="bg-black py-6 overflow-hidden border-b-4 border-brand-red">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-brand-red text-white">
                                    <Flame className="w-4 h-4 fill-current" />
                                </div>
                                <div className="flex flex-col leading-none">
                                    <span className={`${gothic.className} text-brand-red text-lg`}>Exclusive</span>
                                    <h2 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">
                                        Offer Drops <span className="text-brand-red ml-1">{`(${offerDropProducts.length})`}</span>
                                    </h2>
                                </div>
                            </div>
                            <div className="hidden sm:block">
                                <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest border border-gray-800 px-2 py-0.5">Limited Time Only</span>
                            </div>
                        </div>

                        {/* Smaller Horizontal Scroll Grid */}
                        <div
                            ref={offerScrollRef}
                            onWheel={handleUserInteraction}
                            onTouchStart={handleUserInteraction}
                            onPointerDown={handleUserInteraction}
                            className="overflow-x-auto scrollbar-hide flex gap-3 pb-2 no-scrollbar"
                            style={{
                                overscrollBehaviorX: 'contain',
                                WebkitOverflowScrolling: 'touch'
                            }}
                        >
                            {offerDropProducts.map((product) => (
                                <div key={product.id} className="min-w-[100px] md:min-w-[120px] flex-shrink-0">
                                    <ProductCard
                                        product={product}
                                        onSelect={handleProductSelect}
                                        variant="small"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* NEW: Shop By Categories (Circular Design) */}
            <section className="py-20 container mx-auto px-4">
                <ShopCategoryCircles
                    categories={categories}
                    onSelectCategory={(catName) => {
                        window.location.href = `/shop?category=${encodeURIComponent(catName)}`;
                    }}
                />
            </section>

            {/* Trending Now Products */}
            <ProductCarousel
                products={trendingProducts}
                title="Trending Now"
                subtitle="Explore the newest additions to our collection crafted for the modern man who loves to stay ahead in fashion."
                ctaText="SHOP MORE"
                ctaLink="/shop?isTrending=true"
                onSelect={handleProductSelect}
            />

            {/* New Arrivals Products */}
            <ProductCarousel
                products={newArrivalProducts}
                title="New Arrivals"
                subtitle="Explore our newest arrivals featuring trendy shirts, jeans, and T-shirts crafted for comfort and confidence. Step into the season with style that sets you apart."
                ctaText="EXPLORE NOW"
                ctaLink="/shop?isNewArrival=true"
                onSelect={handleProductSelect}
            />

            {/* Best Offers Products */}
            <ProductCarousel
                products={bestOfferProducts}
                title="Best Offers"
                subtitle="Don't miss out on our exclusive deals and limited-time offers. Quality meets affordability in our handpicked collection of premium menswear."
                ctaText="GRAB DEALS"
                ctaLink="/shop?isOffer=true"
                onSelect={handleProductSelect}
            />

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

            {/* Product Detail Modal */}
            {selectedProduct && (
                <ProductDetailModal
                    product={selectedProduct}
                    onClose={handleModalClose}
                />
            )}
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
