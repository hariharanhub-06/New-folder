import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { Discount } from '@/lib/types';

// GET: Fetch all active discounts
export async function GET() {
    try {
        const res = await pool.query('SELECT * FROM discounts WHERE active = true ORDER BY created_at DESC');
        const discounts = res.rows.map((row: any) => ({
            id: row.id,
            discountType: row.discount_type || 'bundle',
            targetType: row.target_type || 'category',
            category: row.category,
            productId: row.product_id,
            quantity: row.quantity,
            price: row.price ? parseFloat(row.price) : undefined,
            percentage: row.percentage,
            active: row.active,
            createdAt: row.created_at
        }));
        return NextResponse.json(discounts);
    } catch (error: any) {
        console.error('Error fetching discounts:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Create a new discount
export async function POST(request: Request) {
    try {
        const data = await request.json();
        const id = crypto.randomUUID();

        const { discountType, targetType, category, productId, quantity, price, percentage } = data;

        await pool.query(
            `INSERT INTO discounts (id, discount_type, target_type, category, product_id, quantity, price, percentage, active) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [id, discountType, targetType, category || null, productId || null, quantity || null, price || null, percentage || null, true]
        );

        return NextResponse.json({ success: true, id });
    } catch (error: any) {
        console.error('Error creating discount:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Remove a discount
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Discount ID required' }, { status: 400 });
    }

    try {
        await pool.query('DELETE FROM discounts WHERE id = $1', [id]);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting discount:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
