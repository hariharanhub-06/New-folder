
import { NextResponse } from 'next/server';
import { getDiscounts } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const discounts = await getDiscounts();
        const activeDiscounts = discounts.filter(d => d.active);
        return NextResponse.json(activeDiscounts);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
