
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        await pool.query(`
            ALTER TABLE order_items 
            ADD COLUMN IF NOT EXISTS size VARCHAR(50);
        `);
        return NextResponse.json({ success: true, message: 'Migration successful: size column added to order_items' });
    } catch (error) {
        console.error('Migration failed:', error);
        return NextResponse.json({ success: false, error: (error as any).message }, { status: 500 });
    }
}
