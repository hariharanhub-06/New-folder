import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request: Request) {
    try {
        const { orderId, reason } = await request.json();

        if (!orderId || !reason) {
            return NextResponse.json({ error: 'Missing orderId or reason' }, { status: 400 });
        }

        await db.query(`
            UPDATE orders 
            SET drop_reason = $1 
            WHERE id = $2 AND status = 'Pending Payment'
        `, [reason, orderId]);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Update Drop Reason Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
