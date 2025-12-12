
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        // Add new columns to support flexible discount system
        await pool.query(`
            ALTER TABLE discounts 
            ADD COLUMN IF NOT EXISTS discount_type VARCHAR(20) DEFAULT 'bundle',
            ADD COLUMN IF NOT EXISTS target_type VARCHAR(20) DEFAULT 'category',
            ADD COLUMN IF NOT EXISTS percentage INTEGER;
        `);

        return NextResponse.json({ success: true, message: 'Migration successful: flexible discount system enabled' });
    } catch (error) {
        console.error('Migration failed:', error);
        return NextResponse.json({ success: false, error: (error as any).message }, { status: 500 });
    }
}
