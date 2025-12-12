import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET: Fetch all active product discounts
export async function GET() {
    try {
        const res = await pool.query('SELECT * FROM product_discounts WHERE active = true ORDER BY created_at DESC');
        const discounts = res.rows.map((row: any) => ({
            id: row.id,
            productId: row.product_id,
            discountPercentage: row.discount_percentage,
            active: row.active,
            createdAt: row.created_at
        }));
        return NextResponse.json(discounts);
    } catch (error: any) {
        console.error('Error fetching product discounts:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Create a new product discount
export async function POST(request: Request) {
    try {
        const { productId, discountPercentage } = await request.json();
        const id = crypto.randomUUID();

        // Check if discount already exists for this product
        const existing = await pool.query('SELECT id FROM product_discounts WHERE product_id = $1 AND active = true', [productId]);
        if (existing.rows.length > 0) {
            return NextResponse.json({ error: 'Discount already exists for this product' }, { status: 400 });
        }

        await pool.query(
            'INSERT INTO product_discounts (id, product_id, discount_percentage, active) VALUES ($1, $2, $3, $4)',
            [id, productId, discountPercentage, true]
        );

        return NextResponse.json({ success: true, id });
    } catch (error: any) {
        console.error('Error creating product discount:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Remove a product discount
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Discount ID required' }, { status: 400 });
    }

    try {
        await pool.query('DELETE FROM product_discounts WHERE id = $1', [id]);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting product discount:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
