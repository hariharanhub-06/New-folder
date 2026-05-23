"use client";

import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

export default function ChangePasswordForm() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(''); setSuccess('');
        if (newPassword !== confirmPassword) { setError('New passwords do not match'); return; }
        if (newPassword.length < 8) { setError('New password must be at least 8 characters'); return; }
        setLoading(true);
        try {
            const res = await fetch('/api/customer/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Failed to change password'); return; }
            setSuccess('Password changed successfully!');
            setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        } catch { setError('Something went wrong. Please try again.'); }
        finally { setLoading(false); }
    }

    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <Lock className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Change Password</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">Current Password</label>
                    <div className="relative">
                        <input
                            type={showCurrent ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={e => setCurrentPassword(e.target.value)}
                            required
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button type="button" onClick={() => setShowCurrent(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">New Password</label>
                    <div className="relative">
                        <input
                            type={showNew ? 'text' : 'password'}
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            required
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button type="button" onClick={() => setShowNew(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">Confirm New Password</label>
                    <div className="relative">
                        <input
                            type={showConfirm ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            required
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button type="button" onClick={() => setShowConfirm(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>}
                {success && <p className="text-green-600 text-sm bg-green-50 border border-green-200 rounded-lg px-4 py-3">{success}</p>}

                <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold uppercase tracking-wider text-sm hover:bg-indigo-700 transition-colors disabled:opacity-60">
                    {loading ? 'Saving...' : 'Update Password'}
                </button>
            </form>
        </div>
    );
}
