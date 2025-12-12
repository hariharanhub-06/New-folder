"use client";

import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";

export default function HomePage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="relative bg-slate-900 text-white overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 flex flex-col items-center text-center">
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-amber-200 to-amber-500 bg-clip-text text-transparent">
                        STARTUP MENSWEAR
                    </h1>
                    <p className="max-w-2xl text-lg md:text-xl text-slate-300 mb-10 leading-relaxed">
                        Redefining professional style for the modern entrepreneur.
                        Premium fabrics, impeccable fits, and designs that command respect.
                        Elevate your wardrobe today.
                    </p>

                    <Link
                        href="/shop"
                        className="inline-flex items-center px-8 py-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-full transition-all transform hover:scale-105 shadow-lg gap-2"
                    >
                        See Our Collection
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </section>

            {/* Map / Location Section */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
                                <MapPin className="w-4 h-4" />
                                Visit Our Store
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900">Experience the Quality in Person</h2>
                            <p className="text-gray-600 text-lg">
                                We believe in the touch and feel of premium fabrics.
                                Visit our flagship store to get measured by experts and find your perfect fit.
                            </p>
                            <div className="space-y-2 text-gray-700">
                                <p className="font-semibold">Startup Menswear</p>
                                <p>140, 141/1, Uppilipalayam Main Road</p>
                                <p>Coimbatore, Tamil Nadu - 641028</p>
                                <p className="text-sm text-gray-500 mt-2">(Open 10 AM - 9 PM, All Days)</p>
                                <a
                                    href="https://maps.app.goo.gl/i2oZrUYp4yudM7JD7"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 mt-4 text-indigo-600 hover:text-indigo-800 font-medium"
                                >
                                    Get Directions <ArrowRight className="w-4 h-4" />
                                </a>
                            </div>
                        </div>

                        <div className="relative h-[400px] bg-gray-200 rounded-2xl overflow-hidden shadow-xl border-4 border-white">
                            {/* Google Maps Embed */}
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3886.973715893693!2d80.2376!3d13.037!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTPCsDAyJzEzLjIiTiA4MMKwMTQnMTUuNCJF!5e0!3m2!1sen!2sin!4v1635760000000!5m2!1sen!2sin"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            ></iframe>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
