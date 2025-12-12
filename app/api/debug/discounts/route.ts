
import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const discounts = await db.query('SELECT * FROM discounts');
        const products = await db.query('SELECT id, name, category, price FROM products');

        return NextResponse.json({
            discounts: discounts.rows,
            products: products.rows
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
