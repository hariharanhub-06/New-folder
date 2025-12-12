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

                <form action={updateAdminCredentials} className="space-y-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3 text-yellow-800 text-sm">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p>Caution: Changing these credentials will affect your next login. Please remember the new password!</p>
                    </div>

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
            </div>
        </div>
    );
}
