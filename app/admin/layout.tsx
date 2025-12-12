"use client";

import Link from "next/link";
import {
    LayoutDashboard,
    Package,
    ShoppingBag,
    Tag,
    Menu,
    X,
    Loader2,
    Settings,
    LogOut
} from "lucide-react";
import { useState, useEffect } from "react";
import AutoRefresh from "@/components/AutoRefresh";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";
import { logoutAdmin } from "@/lib/admin-actions";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    const [clickedTab, setClickedTab] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const pathname = usePathname();

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    const navItems = [
        { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/products", label: "Products", icon: Package },
        { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
        { href: "/admin/discounts", label: "Discounts", icon: Tag },
        { href: "/admin/settings", label: "Settings", icon: Settings },
    ];

    // Reset navigation state when pathname changes
    useEffect(() => {
        setIsNavigating(false);
        setClickedTab(null);
    }, [pathname]);

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        if (pathname === href) {
            e.preventDefault();
            return;
        }
        setIsNavigating(true);
        setClickedTab(href);
        setSidebarOpen(false);
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <AutoRefresh />

            {/* Loading Bar */}
            {mounted && isNavigating && (
                <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 z-[100] animate-pulse">
                    <div className="h-full bg-white/30 animate-[shimmer_1s_infinite]" />
                </div>
            )}

            <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors mr-4"
                            >
                                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                            <Link href="/admin" className="flex items-center gap-2 text-xl font-bold text-white tracking-wider">
                                <Logo className="w-6 h-6" />
                                <span>STARTUP<span className="text-amber-500">MENSWEAR</span></span>
                                <span className="ml-2 text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full tracking-wide">ADMIN</span>
                            </Link>
                        </div>
                        {mounted && isNavigating && (
                            <div className="flex items-center gap-2 text-indigo-400 text-sm">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="hidden sm:inline">Loading...</span>
                            </div>
                        )}
                    </div>
                </div>
            </nav>
            <div className="flex flex-1">
                {sidebarOpen && (
                    <div
                        className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
                <aside
                    className={`
            fixed lg:static inset-y-0 left-0 z-40 top-16
            w-64 bg-slate-900 border-r border-slate-800 flex flex-col
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
                >
                    <div className="p-6">
                        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Main Menu</h2>
                    </div>
                    <nav className="px-3 space-y-1 flex-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            const isClicked = clickedTab === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    prefetch={true}
                                    className={`
                                        flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative
                                        ${isActive ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20" : "text-slate-400 hover:text-white hover:bg-slate-800"}
                                        ${mounted && isClicked && !isActive ? "bg-slate-800 text-white" : ""}
                                        ${mounted && isNavigating && isClicked ? "opacity-75 cursor-wait" : ""}
                                    `}
                                    onClick={(e) => handleNavClick(e, item.href)}
                                >
                                    {mounted && isClicked && isNavigating ? (
                                        <Loader2 className="w-5 h-5 mr-3 animate-spin text-indigo-400" />
                                    ) : (
                                        <item.icon className={`w-5 h-5 mr-3 transition-colors ${isActive ? "text-white" : "text-slate-500 group-hover:text-white"}`} />
                                    )}
                                    {item.label}
                                    {isActive && !(mounted && isNavigating) && (
                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="p-3 border-t border-slate-800">
                        <form action={logoutAdmin}>
                            <button
                                type="submit"
                                className="w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:text-white hover:bg-red-500/10 transition-colors group"
                            >
                                <LogOut className="w-5 h-5 mr-3 group-hover:text-red-300" />
                                Sign Out
                            </button>
                        </form>
                    </div>
                </aside>
                <main className="flex-1 p-4 lg:p-8 overflow-y-auto bg-gray-50">{children}</main>
            </div>
        </div>
    );
}
