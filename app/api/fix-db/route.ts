import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        console.log('Starting migration via API...');

        await pool.query(`
            ALTER TABLE discounts 
            ALTER COLUMN quantity DROP NOT NULL,
            ALTER COLUMN price DROP NOT NULL;
        `);

        return NextResponse.json({ success: true, message: 'Migration completed: quantity and price are now nullable.' });
    } catch (error: any) {
        console.error('Migration failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
