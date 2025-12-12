
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        // Add product_id column to discounts table
        await pool.query(`
            ALTER TABLE discounts 
            ADD COLUMN IF NOT EXISTS product_id TEXT;
        `);

        // Remove old category column constraint if any issues
        // (Optional - can keep category column for backward compatibility)

        return NextResponse.json({ success: true, message: 'Migration successful: discounts table updated for product bundles' });
    } catch (error) {
        console.error('Migration failed:', error);
        return NextResponse.json({ success: false, error: (error as any).message }, { status: 500 });
    }
}
