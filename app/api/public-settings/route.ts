import { NextResponse } from 'next/server';
import { getSiteSettings } from '@/lib/db';

export const dynamic = 'force-dynamic';

const PUBLIC_KEYS = ['require_login'];

export async function GET() {
    try {
        const all = await getSiteSettings();
        const pub: Record<string, string> = {};
        for (const key of PUBLIC_KEYS) {
            pub[key] = all[key] ?? 'true';
        }
        return NextResponse.json(pub);
    } catch {
        return NextResponse.json({ require_login: 'true' });
    }
}
