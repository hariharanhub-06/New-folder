"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Customer } from './types';

interface CustomerContextType {
    customer: Customer | null;
    loading: boolean;
    refresh: () => Promise<void>;
}

const CustomerContext = createContext<CustomerContextType>({
    customer: null,
    loading: true,
    refresh: async () => {},
});

export function CustomerProvider({ children }: { children: ReactNode }) {
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchCustomer = async () => {
        try {
            const res = await fetch('/api/customer/me');
            if (res.ok) {
                const data = await res.json();
                setCustomer(data.customer ?? null);
            } else {
                setCustomer(null);
            }
        } catch {
            setCustomer(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomer();
    }, []);

    return (
        <CustomerContext.Provider value={{ customer, loading, refresh: fetchCustomer }}>
            {children}
        </CustomerContext.Provider>
    );
}

export function useCustomer() {
    return useContext(CustomerContext);
}
