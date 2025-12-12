
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS product_sizes (
                id TEXT PRIMARY KEY,
                product_id TEXT NOT NULL,
                size VARCHAR(50) NOT NULL,
                stock INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            );
        `);
        return NextResponse.json({ success: true, message: 'Migration successful' });
    } catch (error) {
        console.error('Migration failed:', error);
        return NextResponse.json({ success: false, error: (error as any).message }, { status: 500 });
    }
}
