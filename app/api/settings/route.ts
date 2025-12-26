import { NextResponse } from 'next/server';
import { getSiteSettings, updateSiteSetting } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const settings = await getSiteSettings();
        return NextResponse.json(settings);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { key, value } = await request.json();
        if (!key || value === undefined) {
            return NextResponse.json({ error: 'Missing key or value' }, { status: 400 });
        }
        await updateSiteSetting(key, value);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
