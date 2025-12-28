
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import db from '@/lib/db';
import { sendMail } from '@/lib/email';

export async function POST(request: Request) {
    try {
        const body = await request.text(); // Get raw body for signature verification
        const signature = request.headers.get('x-razorpay-signature');

        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!secret) {
            console.error("Razorpay Webhook Secret missing");
            return NextResponse.json({ error: 'Webhook Secret missing' }, { status: 500 });
        }

        // 1. Verify Signature
        const generated_signature = crypto
            .createHmac("sha256", secret)
            .update(body)
            .digest("hex");

        if (generated_signature !== signature) {
            console.error("Invalid Webhook Signature");
            return NextResponse.json({ error: 'Invalid Signature' }, { status: 400 });
        }

        const payload = JSON.parse(body);
        const event = payload.event;

        if (event === 'payment.captured') {
            const payment = payload.payload.payment.entity;
            const razorpay_order_id = payment.order_id;
            const razorpay_payment_id = payment.id;
            const internal_order_id = payment.notes?.internal_order_id;
            const customer_email = payment.email;
            const customer_phone = payment.contact;

            if (!internal_order_id) {
                console.error("Webhook: internal_order_id missing in notes");
                return NextResponse.json({ error: 'Internal Order ID missing' }, { status: 400 });
            }

            console.log(`Webhook: Processing payment for Order ${internal_order_id}`);

            // 2. Promote Shadow Order to Real Order
            const client = await db.connect();
            try {
                await client.query('BEGIN');

                // Idempotent Update
                const updateRes = await client.query(`
                    UPDATE orders 
                    SET status = 'Payment Confirmed',
                        razorpay_order_id = $1,
                        razorpay_payment_id = $2,
                        customer_mobile = COALESCE(NULLIF($4, ''), customer_mobile)
                    WHERE id = $3 AND status = 'Pending Payment'
                `, [
                    razorpay_order_id,
                    razorpay_payment_id,
                    internal_order_id,
                    customer_phone || ''
                ]);

                if (updateRes.rowCount > 0) {
                    console.log(`Webhook: Promoted Order ${internal_order_id} to Confirmed`);

                    // 3. Decrement Stock
                    const itemsRes = await client.query('SELECT product_id, size, quantity FROM order_items WHERE order_id = $1', [internal_order_id]);

                    for (const item of itemsRes.rows) {
                        if (item.product_id) {
                            if (item.size) {
                                await client.query(`
                                     UPDATE product_sizes 
                                     SET stock = GREATEST(0, stock - $1)
                                     WHERE product_id = $2 AND size = $3
                                 `, [item.quantity, item.product_id, item.size]);

                                // Also decrement main product stock
                                await client.query(`
                                     UPDATE products SET stock = GREATEST(0, stock - $1) WHERE id = $2
                                 `, [item.quantity, item.product_id]);

                            } else {
                                await client.query(`
                                     UPDATE products 
                                     SET stock = GREATEST(0, stock - $1)
                                     WHERE id = $2
                                 `, [item.quantity, item.product_id]);
                            }
                        }
                    }

                    // 4. Send Email (Backend initiated)
                    if (customer_email) {
                        const orderSummaryHtml = `
                            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-xl">
                                <h1 style="color: #4f46e5; text-align: center;">Order Confirmed!</h1>
                                <p>Hi,</p>
                                <p>Thank you for your purchase. Your order <b>#${internal_order_id.slice(0, 8)}</b> has been successfully verified via our secure payment gateway.</p>
                                <p>We'll notify you once it ships.</p>
                            </div>
                        `;
                        await sendMail(
                            customer_email,
                            `Order Confirmed (Webhook) - #${internal_order_id.slice(0, 8)}`,
                            orderSummaryHtml
                        ).catch(e => console.error('Webhook Email send failed:', e));
                    }

                } else {
                    console.log(`Webhook: Order ${internal_order_id} already confirmed or invalid.`);
                }

                await client.query('COMMIT');
            } catch (dbError) {
                await client.query('ROLLBACK');
                throw dbError;
            } finally {
                client.release();
            }
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
