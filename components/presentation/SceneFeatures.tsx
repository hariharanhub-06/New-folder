
"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, LayoutDashboard, CreditCard } from "lucide-react";

export default function SceneFeatures() {
    const [step, setStep] = useState(0);

    useEffect(() => {
        setTimeout(() => setStep(1), 500);
        setTimeout(() => setStep(2), 1500);
    }, []);

    return (
        <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center">
            <div className="flex gap-12">

                {/* Card 1: Admin */}
                <div className={`w-[400px] h-[500px] bg-slate-900 rounded-3xl p-8 border border-slate-800 flex flex-col items-center justify-center text-center transition-all duration-1000 transform ${step >= 1 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-20'}`}>
                    <div className="w-32 h-32 bg-indigo-500/20 rounded-full flex items-center justify-center mb-8">
                        <LayoutDashboard className="w-16 h-16 text-indigo-400" />
                    </div>
                    <h2 className="text-3xl font-bold mb-4">Total Control</h2>
                    <p className="text-slate-400 text-lg">
                        Full-featured Admin Dashboard. <br />
                        Manage Inventory, Orders, <br />
                        and Analytics in real-time.
                    </p>
                </div>

                {/* Card 2: Security */}
                <div className={`w-[400px] h-[500px] bg-slate-900 rounded-3xl p-8 border border-slate-800 flex flex-col items-center justify-center text-center transition-all duration-1000 delay-200 transform ${step >= 2 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-20'}`}>
                    <div className="w-32 h-32 bg-emerald-500/20 rounded-full flex items-center justify-center mb-8 relative">
                        <ShieldCheck className="w-16 h-16 text-emerald-400" />
                        <div className="absolute -bottom-2 -right-2 bg-blue-600 rounded-full p-2">
                            <CreditCard className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold mb-4">Secure Transactions</h2>
                    <p className="text-slate-400 text-lg">
                        Powered by <span className="text-blue-400 font-bold">Razorpay</span>. <br />
                        Bank-grade security. <br />
                        Seamless checkout flow.
                    </p>
                </div>
            </div>
        </div>
    );
}
