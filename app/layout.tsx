import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import Navbar from "@/components/Navbar";
import { Analytics } from "@vercel/analytics/react";
import { Instagram } from "lucide-react";
import ScrollFix from "@/components/ScrollFix";

export const metadata: Metadata = {
    title: "Startup Men's Wear",
    description: "Premium Men's Fashion",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="antialiased bg-gray-50">
                <CartProvider>
                    <Navbar />
                    <main className="min-h-screen pb-12">
                        {children}
                    </main>
                    <footer className="bg-slate-900 text-slate-300 py-12">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div>
                                    <h3 className="text-white text-lg font-bold mb-4">Startup Men&apos;s Wear</h3>
                                    <p className="text-sm">Premium fashion for the modern entrepreneur.</p>
                                </div>
                                <div>
                                    <h3 className="text-white text-lg font-bold mb-4">Contact Us</h3>
                                    <p className="text-sm mb-2">Customer Support: +91 80151 03119</p>
                                    <p className="text-sm mb-4">140/1, Car St, Sowri Palayam,<br />Coimbatore, Tamil Nadu 641028</p>
                                    <a
                                        href="https://www.instagram.com/startupmens?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-white hover:text-amber-500 transition-colors w-fit"
                                    >
                                        <Instagram className="w-5 h-5" />
                                        <span>Instagram</span>
                                    </a>
                                </div>
                                <div>
                                    <h3 className="text-white text-lg font-bold mb-4">Quick Links</h3>
                                    <ul className="space-y-2 text-sm">
                                        <li><a href="/shop" className="hover:text-white">Shop</a></li>
                                    </ul>
                                </div>
                            </div>
                            <div className="border-t border-slate-800 mt-8 pt-8 text-center text-xs">
                                &copy; {new Date().getFullYear()} Startup Men&apos;s Wear. All rights reserved.
                            </div>
                        </div>
                    </footer>
                </CartProvider>
                <ScrollFix />
                <Analytics />
            </body>
        </html>
    );
}
