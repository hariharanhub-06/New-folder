"use client";

import { updateAdminCredentials } from "@/lib/admin-actions";
import { User, Lock, Save, AlertCircle, CheckCircle, XCircle } from "lucide-react";
// @ts-ignore
import { useFormState } from "react-dom";

const initialState = {
    success: false,
    error: "",
    message: ""
};

export default function SettingsForm() {
    const [state, formAction] = useFormState(updateAdminCredentials, initialState);

    return (
        <form action={formAction} className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3 text-yellow-800 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>Caution: Changing these credentials will affect your next login. Please remember the new password!</p>
            </div>

            {state?.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3 text-red-800 text-sm animate-in fade-in slide-in-from-top-2">
                    <XCircle className="w-5 h-5 flex-shrink-0" />
                    <p>{state.error}</p>
                </div>
            )}

            {state?.success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3 text-green-800 text-sm animate-in fade-in slide-in-from-top-2">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <p>{state.message || "Updated successfully!"}</p>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Username</label>
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        name="newUsername"
                        required
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter new username"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        name="newPassword"
                        required
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter new password"
                    />
                </div>
                <p className="text-xs text-slate-500 mt-1">We recommend using a strong password.</p>
            </div>

            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
                <Save className="w-4 h-4" />
                Update Credentials
            </button>
        </form>
    );
}
