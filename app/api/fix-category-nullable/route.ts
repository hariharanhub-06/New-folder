
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        // Make category column nullable to support product-based discounts
        await pool.query(`
            ALTER TABLE discounts 
            ALTER COLUMN category DROP NOT NULL;
        `);

        return NextResponse.json({
            success: true,
            message: 'Migration successful: category column is now nullable'
        });
    } catch (error) {
        console.error('Migration failed:', error);
        return NextResponse.json({
            success: false,
            error: (error as any).message
        }, { status: 500 });
    }
}
