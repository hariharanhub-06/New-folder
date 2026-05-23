import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Create the product_sizes table if it doesn't exist
        await pool.query(`
            CREATE TABLE IF NOT EXISTS product_sizes (
                id TEXT PRIMARY KEY,
                product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                size TEXT NOT NULL,
                stock INTEGER NOT NULL DEFAULT 0
            );
        `);

        // Verify the table exists
        const checkTable = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'product_sizes'
            );
        `);

        return NextResponse.json({
            success: true,
            message: 'product_sizes table verified',
            tableExists: checkTable.rows[0].exists
        });
    } catch (error: any) {
        console.error('Error ensuring product_sizes table:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            details: error.toString()
        }, { status: 500 });
    }
}
