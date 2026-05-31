"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface SiteSettings {
    requireLogin: boolean;
}

interface SiteSettingsContextType {
    settings: SiteSettings;
    loading: boolean;
}

const defaultSettings: SiteSettings = { requireLogin: true };

const SiteSettingsContext = createContext<SiteSettingsContextType>({
    settings: defaultSettings,
    loading: true,
});

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/public-settings')
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data) {
                    setSettings({ requireLogin: data.require_login !== 'false' });
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    return (
        <SiteSettingsContext.Provider value={{ settings, loading }}>
            {children}
        </SiteSettingsContext.Provider>
    );
}

export function useSiteSettings() {
    return useContext(SiteSettingsContext);
}
