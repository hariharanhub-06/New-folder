import { NextResponse } from 'next/server';
import { getUniqueCategories } from '@/lib/db';

export const dynamic = 'force-dynamic'; // Prevent caching of category list

export async function GET() {
    try {
        const categories = await getUniqueCategories();
        return NextResponse.json(categories);
    } catch (error: any) {
        console.error('Error fetching categories:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
