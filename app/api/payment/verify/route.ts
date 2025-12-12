
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import db from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = body;

        const secret = process.env.RAZORPAY_KEY_SECRET;
        if (!secret) throw new Error("Razorpay Secret missing");

        // Verify Signature
        const generated_signature = crypto
            .createHmac("sha256", secret)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex");

        if (generated_signature !== razorpay_signature) {
            return NextResponse.json({ error: 'Invalid Payment Signature' }, { status: 400 });
        }

        // Update Database (Postgres)
        await db.query(`
            UPDATE orders 
            SET status = 'Payment Confirmed',
                transaction_id = $1,
                cashfree_payment_id = $1, 
                cashfree_order_id = $2
            WHERE id = $3
        `, [
            razorpay_payment_id,
            razorpay_order_id,
            orderId
        ]);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Payment Verification Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
