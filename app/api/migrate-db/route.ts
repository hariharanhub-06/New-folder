import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await db.query(`
            ALTER TABLE orders 
            ADD COLUMN IF NOT EXISTS courier_name VARCHAR(255);
        `);
        return NextResponse.json({ success: true, message: "Migration successful: courier_name column added." });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
