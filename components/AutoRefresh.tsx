"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface AutoRefreshProps {
    interval?: number; // in milliseconds
}

export default function AutoRefresh({ interval = 500 }: AutoRefreshProps) {
    const router = useRouter();

    useEffect(() => {
        const refreshInterval = setInterval(() => {
            router.refresh();
        }, interval);

        return () => clearInterval(refreshInterval);
    }, [router, interval]);

    return null;
}
