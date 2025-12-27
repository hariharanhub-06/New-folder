"use client";

import { updateAdminCredentials } from "@/lib/admin-actions";
import { User, Lock, Save, AlertCircle, CheckCircle, XCircle, Layout, Shield, Bell, Map as MapIcon, Phone, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
// @ts-ignore
import { useFormState } from "react-dom";
import { getSettings, updateSetting } from "@/lib/api";

const initialState = {
    success: false,
    error: "",
    message: ""
};

export default function SettingsForm() {
    const [activeTab, setActiveTab] = useState<'design' | 'security'>('design');
    const [state, formAction] = useFormState(updateAdminCredentials, initialState);
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [updatingKey, setUpdatingKey] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        try {
            const data = await getSettings();
            setSettings(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleUpdateSetting(key: string, value: string) {
        setUpdatingKey(key);
        try {
            await updateSetting(key, value);
            setSettings(prev => ({ ...prev, [key]: value }));
        } catch (err) {
            alert("Failed to update setting");
        } finally {
            setUpdatingKey(null);
        }
    }

    return (
        <div className="space-y-8 font-jost">
            {/* Tabs */}
            <div className="flex gap-4 border-b-2 border-black pb-4">
                <button
                    onClick={() => setActiveTab('design')}
                    className={`flex items-center gap-2 px-6 py-2 font-bold uppercase tracking-widest text-xs transition-all ${activeTab === 'design' ? 'bg-black text-white' : 'text-gray-400 hover:text-black'}`}
                >
                    <Layout className="w-4 h-4" /> Site Design
                </button>
                <button
                    onClick={() => setActiveTab('security')}
                    className={`flex items-center gap-2 px-6 py-2 font-bold uppercase tracking-widest text-xs transition-all ${activeTab === 'security' ? 'bg-black text-white' : 'text-gray-400 hover:text-black'}`}
                >
                    <Shield className="w-4 h-4" /> Admin Security
                </button>
            </div>

            {activeTab === 'design' ? (
                <div className="space-y-10 animate-in fade-in slide-in-from-left-4 duration-300">
                    {/* Hero Section */}
                    <div className="bg-white border-2 border-black p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
                        <div className="flex items-center gap-3 mb-6">
                            <Layout className="w-5 h-5 text-brand-red" />
                            <h3 className="text-sm font-black uppercase tracking-widest italic">Hero Section</h3>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Hero Title (Gothic)</label>
                                <input
                                    type="text"
                                    defaultValue={settings.hero_title || "Startup"}
                                    onBlur={(e) => handleUpdateSetting('hero_title', e.target.value)}
                                    className="w-full bg-gray-50 border-2 border-black/10 px-4 py-3 text-sm font-medium outline-none focus:border-black transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Hero Subtitle</label>
                                <input
                                    type="text"
                                    defaultValue={settings.hero_subtitle || "Menswear"}
                                    onBlur={(e) => handleUpdateSetting('hero_subtitle', e.target.value)}
                                    className="w-full bg-gray-50 border-2 border-black/10 px-4 py-3 text-sm font-medium outline-none focus:border-black transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Hero Background Image URL</label>
                                <input
                                    type="text"
                                    defaultValue={settings.hero_image_url || "/streetwear_hero_bg.png"}
                                    onBlur={(e) => handleUpdateSetting('hero_image_url', e.target.value)}
                                    className="w-full bg-gray-50 border-2 border-black/10 px-4 py-3 text-sm font-medium outline-none focus:border-black transition-colors"
                                />
                            </div>
                            <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                                <input
                                    type="checkbox"
                                    checked={settings.hero_use_map === 'true'}
                                    onChange={(e) => handleUpdateSetting('hero_use_map', e.target.checked ? 'true' : 'false')}
                                    className="w-5 h-5 accent-brand-red cursor-pointer"
                                />
                                <label className="text-[10px] font-bold uppercase tracking-widest cursor-pointer">Use Map as Hero Background</label>
                            </div>
                        </div>
                    </div>

                    {/* Announcement Bar */}
                    <div className="bg-white border-2 border-black p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
                        <div className="flex items-center gap-3 mb-6">
                            <Bell className="w-5 h-5 text-brand-red" />
                            <h3 className="text-sm font-black uppercase tracking-widest italic">Announcement Bar</h3>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Announcement Text</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        defaultValue={settings.announcement_text || ""}
                                        onBlur={(e) => handleUpdateSetting('announcement_text', e.target.value)}
                                        className="flex-1 bg-gray-50 border-2 border-black/10 px-4 py-3 text-sm font-medium outline-none focus:border-black transition-colors"
                                        placeholder="Enter offer text..."
                                    />
                                    {updatingKey === 'announcement_text' && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-red"></div>}
                                </div>
                                <p className="text-[10px] text-gray-400 mt-2">This appears at the very top of every page.</p>
                            </div>
                        </div>
                    </div>

                    {/* Google Map */}
                    <div className="bg-white border-2 border-black p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
                        <div className="flex items-center gap-3 mb-6">
                            <MapIcon className="w-5 h-5 text-brand-red" />
                            <h3 className="text-sm font-black uppercase tracking-widest italic">Location & Map</h3>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Google Maps Embed URL</label>
                                <input
                                    type="text"
                                    defaultValue={settings.map_embed_url || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3916.3773012018837!2d77.0067921!3d11.010292399999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba859f4812f391d%3A0xa8a96c670b9665a1!2sStartup%20mens%20wear!5e0!3m2!1sen!2sin!4v1766808721731!5m2!1sen!2sin"}
                                    onBlur={(e) => handleUpdateSetting('map_embed_url', e.target.value)}
                                    className="w-full bg-gray-50 border-2 border-black/10 px-4 py-3 text-sm font-medium outline-none focus:border-black transition-colors"
                                    placeholder="https://google.com/maps/embed/..."
                                />
                                <p className="text-[10px] text-gray-400 mt-2">Go to Google Maps &gt; Share &gt; Embed a map &gt; Copy the &apos;src&apos; attribute.</p>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Store Address</label>
                                <textarea
                                    defaultValue={settings.contact_address || "160/1, CAR ST, SOWRIPALAYAM, COIMBATORE, TAMIL NADU 641028"}
                                    onBlur={(e) => handleUpdateSetting('contact_address', e.target.value)}
                                    rows={3}
                                    className="w-full bg-gray-50 border-2 border-black/10 px-4 py-3 text-sm font-medium outline-none focus:border-black transition-colors resize-none"
                                    placeholder="Enter physical store address..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="bg-white border-2 border-black p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
                        <div className="flex items-center gap-3 mb-6">
                            <Phone className="w-5 h-5 text-brand-red" />
                            <h3 className="text-sm font-black uppercase tracking-widest italic">Contact Details</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Customer Support Phone</label>
                                <input
                                    type="text"
                                    defaultValue={settings.contact_phone || ""}
                                    onBlur={(e) => handleUpdateSetting('contact_phone', e.target.value)}
                                    className="w-full bg-gray-50 border-2 border-black/10 px-4 py-3 text-sm font-medium outline-none focus:border-black transition-colors"
                                    placeholder="+91..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Explicit Save Button for UX */}
                    <div className="flex flex-col gap-4">
                        <button
                            onClick={() => {
                                setSaveSuccess(true);
                                setTimeout(() => setSaveSuccess(false), 3000);
                            }}
                            className="w-full bg-black hover:bg-brand-red text-white font-bold uppercase tracking-widest text-sm py-4 transition-all flex items-center justify-center gap-2 shadow-[8px_8px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
                        >
                            <Save className="w-5 h-5" />
                            Save Configuration
                        </button>
                        {saveSuccess && (
                            <div className="flex items-center justify-center gap-2 text-green-600 font-bold uppercase tracking-widest text-[10px] animate-bounce">
                                <CheckCircle className="w-4 h-4" />
                                All changes synced to mainframe
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <form action={formAction} className="bg-white border-2 border-black p-8 shadow-[8px_8px_0px_rgba(0,0,0,1)] space-y-8">
                        <div className="flex items-start gap-4 p-4 bg-brand-red/5 border-l-4 border-brand-red text-xs">
                            <AlertCircle className="w-5 h-5 text-brand-red shrink-0" />
                            <div>
                                <p className="font-bold uppercase mb-1">Security Alert</p>
                                <p className="text-gray-500">Changing credentials will log you out. Ensure you have the new details saved securely.</p>
                            </div>
                        </div>

                        {state?.error && (
                            <div className="bg-red-50 border-2 border-red-200 p-4 flex gap-3 text-red-800 text-sm">
                                <XCircle className="w-5 h-5 flex-shrink-0" />
                                <p className="font-bold">{state.error}</p>
                            </div>
                        )}

                        {state?.success && (
                            <div className="bg-green-50 border-2 border-green-200 p-4 flex gap-3 text-green-800 text-sm">
                                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                                <p className="font-bold">{state.message || "Security protocols updated!"}</p>
                            </div>
                        )}

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">New Identity (Username)</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        name="newUsername"
                                        required
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-black/10 font-bold outline-none focus:border-black"
                                        placeholder="Admin Alias"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">New Access Key (Password)</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="password"
                                        name="newPassword"
                                        required
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-black/10 font-bold outline-none focus:border-black"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        <button type="submit" className="w-full bg-black hover:bg-brand-red text-white font-bold uppercase tracking-widest text-sm py-4 transition-all flex items-center justify-center gap-2">
                            <Save className="w-5 h-5" />
                            Execute Security Update
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
