import { User, Lock } from "lucide-react";
import SettingsForm from "./SettingsForm";

export const dynamic = 'force-dynamic';

export default function AdminSettingsPage() {
    return (
        <div className="space-y-8 max-w-2xl">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Admin Settings</h1>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                        <Lock className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Change Admin Credentials</h2>
                        <p className="text-slate-500 text-sm">Update your login username and password here.</p>
                    </div>
                </div>

                <SettingsForm />
            </div>
        </div>
    );
}
