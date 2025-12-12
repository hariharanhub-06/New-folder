
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        // Create product_discounts table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS product_discounts (
                id TEXT PRIMARY KEY,
                product_id TEXT NOT NULL,
                discount_percentage INTEGER NOT NULL,
                active BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            );
        `);
        return NextResponse.json({ success: true, message: 'Migration successful: product_discounts table created' });
    } catch (error) {
        console.error('Migration failed:', error);
        return NextResponse.json({ success: false, error: (error as any).message }, { status: 500 });
    }
}
