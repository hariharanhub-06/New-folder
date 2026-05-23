import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        // Add weight column (in grams, default 750g = 0.75kg)
        await pool.query(`
            ALTER TABLE products 
            ADD COLUMN IF NOT EXISTS weight INTEGER DEFAULT 750
        `);

        // Verify the column was added
        const result = await pool.query(`
            SELECT column_name, data_type, column_default
            FROM information_schema.columns
            WHERE table_name = 'products' AND column_name = 'weight'
        `);

        if (result.rows.length > 0) {
            return NextResponse.json({
                success: true,
                message: 'Weight column added successfully',
                column: result.rows[0]
            });
        } else {
            return NextResponse.json({
                success: false,
                message: 'Failed to verify weight column'
            }, { status: 500 });
        }
    } catch (error: any) {
        console.error('Error adding weight column:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
