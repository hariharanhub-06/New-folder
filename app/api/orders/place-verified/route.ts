
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import db from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            paymentDetails,
            cartItems,
            shippingAddress,
            customerDetails,
            totals
        } = body;

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentDetails;

        if (!razorpay_payment_id || !razorpay_signature) {
            return NextResponse.json({ error: 'Missing payment details' }, { status: 400 });
        }

        const secret = process.env.RAZORPAY_KEY_SECRET;
        if (!secret) throw new Error("Razorpay Secret missing locally");

        // 1. Verify Signature
        const generated_signature = crypto
            .createHmac("sha256", secret)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex");

        if (generated_signature !== razorpay_signature) {
            return NextResponse.json({ error: 'Invalid Payment Signature' }, { status: 400 });
        }

        // 2. Create Order in Database (It's verified now!)
        const client = await db.connect();
        const orderId = crypto.randomUUID();

        try {
            await client.query('BEGIN');

            // Insert Order
            await client.query(`
                INSERT INTO orders (
                    id, customer_name, customer_email, customer_mobile,
                    shipping_address, total_amount, shipping_cost, status,
                    transaction_id, cashfree_payment_id, cashfree_order_id
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9, $10)
            `, [
                orderId,
                customerDetails.name,
                customerDetails.email,
                customerDetails.mobile,
                JSON.stringify(shippingAddress),
                totals.grandTotal,
                totals.shippingCost, // This includes gateway fee effectively in logic, or we store separately? 
                // DB schema has shipping_cost. Let's store actual shipping cost. 
                // Total amount is what user paid.
                'Payment Confirmed', // Direct to confirmed status
                razorpay_payment_id,
                razorpay_order_id
            ]);

            // Insert Items & Decrement Stock
            for (const item of cartItems) {
                await client.query(`
                    INSERT INTO order_items (id, order_id, product_id, name, quantity, price, size)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                `, [
                    crypto.randomUUID(),
                    orderId,
                    item.id,
                    item.name,
                    item.quantity,
                    item.price,
                    item.selectedSize || null
                ]);

                // Decrement Stock
                if (item.selectedSize) {
                    await client.query(`
                        UPDATE product_sizes 
                        SET stock = GREATEST(0, stock - $1)
                        WHERE product_id = $2 AND size = $3
                    `, [item.quantity, item.id, item.selectedSize]);

                    // Also decrement main product stock
                    await client.query(`
                        UPDATE products SET stock = GREATEST(0, stock - $1) WHERE id = $2
                    `, [item.quantity, item.id]);

                } else {
                    await client.query(`
                        UPDATE products 
                        SET stock = GREATEST(0, stock - $1)
                        WHERE id = $2
                    `, [item.quantity, item.id]);
                }
            }

            await client.query('COMMIT');

            return NextResponse.json({ success: true, orderId });

        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

    } catch (error: any) {
        console.error('Order Placement Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
