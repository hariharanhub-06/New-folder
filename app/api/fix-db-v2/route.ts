
import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        let connectionString = process.env.DATABASE_URL;

        if (!connectionString) {
            // Fallback: Read .env.local manually
            try {
                const envPath = path.join(process.cwd(), '.env.local');
                if (fs.existsSync(envPath)) {
                    const envContent = fs.readFileSync(envPath, 'utf8');
                    const match = envContent.match(/DATABASE_URL=(.+)/);
                    if (match && match[1]) {
                        connectionString = match[1].trim().replace(/^["']|["']$/g, ''); // Remove quotes
                    }
                }
            } catch (e) {
                console.error("Failed to read .env.local", e);
            }
        }

        if (!connectionString) {
            return NextResponse.json({ success: false, error: "DATABASE_URL not found in env or .env.local" }, { status: 500 });
        }

        const pool = new Pool({
            connectionString: connectionString,
            ssl: true
        });

        await pool.query(`
            CREATE TABLE IF NOT EXISTS product_sizes (
                id TEXT PRIMARY KEY,
                product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                size TEXT NOT NULL,
                stock INTEGER NOT NULL DEFAULT 0
            );
        `);

        // Also verify the table exists now
        const res = await pool.query("SELECT to_regclass('public.product_sizes')");

        await pool.end();

        return NextResponse.json({
            success: true,
            message: "Successfully ensured product_sizes table exists.",
            tableExists: !!res.rows[0].to_regclass
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message, stack: error.stack }, { status: 500 });
    }
}
