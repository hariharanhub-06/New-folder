
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

        // Update Database (Postgres) with transaction
        const client = await db.connect();
        try {
            await client.query('BEGIN');

            await client.query(`
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

            // Decrement stock for specific sizes
            const orderItems = await client.query(`
                SELECT product_id, size, quantity FROM order_items WHERE order_id = $1
            `, [orderId]);

            for (const item of orderItems.rows) {
                if (item.size) {
                    // Decrement stock for specific size variant
                    await client.query(`
                        UPDATE product_sizes 
                        SET stock = GREATEST(0, stock - $1)
                        WHERE product_id = $2 AND size = $3
                    `, [item.quantity, item.product_id, item.size]);

                    // Also update total product stock
                    await client.query(`
                        UPDATE products 
                        SET stock = GREATEST(0, stock - $1)
                        WHERE id = $2
                    `, [item.quantity, item.product_id]);
                } else {
                    // For products without sizes, just decrement product stock
                    await client.query(`
                        UPDATE products 
                        SET stock = GREATEST(0, stock - $1)
                        WHERE id = $2
                    `, [item.quantity, item.product_id]);
                }
            }

            await client.query('COMMIT');
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Payment Verification Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
