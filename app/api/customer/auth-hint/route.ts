import { NextRequest, NextResponse } from 'next/server';
import { hasEverRegistered } from '@/lib/db';

export async function GET(request: NextRequest) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const registered = await hasEverRegistered(ip);
    return NextResponse.json({ hint: registered ? 'login' : 'register' });
}
