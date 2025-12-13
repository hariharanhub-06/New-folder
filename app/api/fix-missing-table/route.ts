
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    let step = 'init';
    try {
        step = 'check_env';
        // Debug Env
        const dbUrl = process.env.DATABASE_URL;
        const hiddenUrl = dbUrl ? `${dbUrl.substring(0, 10)}...` : 'undefined';

        step = 'check_connection';
        // Test connection
        await pool.query('SELECT 1');

        step = 'create_table';
        await pool.query(`
            CREATE TABLE IF NOT EXISTS product_sizes (
                id TEXT PRIMARY KEY,
                product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                size TEXT NOT NULL,
                stock INTEGER NOT NULL DEFAULT 0
            );
        `);
        return NextResponse.json({ success: true, message: "Checked/Created product_sizes table", dbUrlPreview: hiddenUrl });
    } catch (error: any) {
        console.error("Fix table error:", error);
        return NextResponse.json({
            success: false,
            step,
            message: error.message || String(error),
            stack: error.stack,
            envCheck: process.env.DATABASE_URL ? 'Set' : 'Missing'
        }, { status: 200 });
    }
}
