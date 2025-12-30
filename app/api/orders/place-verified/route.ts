
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import db from '@/lib/db';
import { sendMail } from '@/lib/email';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            paymentDetails,
            orderId, // Existing Shadow Order ID
            customerDetails
            // cartItems, shippingAddress, totals are now pulled from DB or updated if needed, 
            // but for simplicity we trust the ID linkage.
        } = body;

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentDetails;

        if (!razorpay_payment_id || !razorpay_signature || !orderId) {
            return NextResponse.json({ error: 'Missing payment or order details' }, { status: 400 });
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

        // 2. Promote Shadow Order to Real Order
        const client = await db.connect();
        let isAlreadyPromoted = false;

        try {
            await client.query('BEGIN');

            // Attempt to update status from 'Pending Payment' to 'Payment Confirmed'
            // This is our idempotency check.
            const updateRes = await client.query(`
                UPDATE orders 
                SET status = 'Payment Confirmed',
                    razorpay_order_id = $1,
                    razorpay_payment_id = $2,
                    customer_mobile = COALESCE(NULLIF($4, ''), customer_mobile) -- Update mobile if provided
                WHERE id = $3 AND status = 'Pending Payment'
            `, [
                razorpay_order_id,
                razorpay_payment_id,
                orderId,
                customerDetails?.mobile || ''
            ]);

            if (updateRes.rowCount === 0) {
                // Check if it was already confirmed
                const checkRes = await client.query('SELECT status FROM orders WHERE id = $1', [orderId]);
                if (checkRes.rows.length > 0 && checkRes.rows[0].status === 'Payment Confirmed') {
                    isAlreadyPromoted = true;
                } else {
                    // Order not found or in weird state
                    await client.query('ROLLBACK');
                    return NextResponse.json({ error: 'Order not valid for confirmation' }, { status: 400 });
                }
            } else {
                // 3. Decrement Stock (Only if we just promoted it)

                // 3. Decrement Stock (Run in parallel for speed)
                // Fetch items to know what to decrement
                const itemsRes = await client.query('SELECT product_id, size, quantity FROM order_items WHERE order_id = $1', [orderId]);

                const updatePromises = itemsRes.rows.map(async (item) => {
                    if (item.product_id) {
                        const queries = [];

                        if (item.size) {
                            // Decrement stock for specific size variant
                            queries.push(client.query(`
                                UPDATE product_sizes 
                                SET stock = GREATEST(0, stock - $1)
                                WHERE product_id = $2 AND size = $3
                            `, [item.quantity, item.product_id, item.size]));

                            // Also decrement main product stock
                            queries.push(client.query(`
                                UPDATE products SET stock = GREATEST(0, stock - $1) WHERE id = $2
                            `, [item.quantity, item.product_id]));
                        } else {
                            // For products without sizes, just decrement product stock
                            queries.push(client.query(`
                                UPDATE products 
                                SET stock = GREATEST(0, stock - $1)
                                WHERE id = $2
                            `, [item.quantity, item.product_id]));
                        }

                        return Promise.all(queries);
                    }
                });

                await Promise.all(updatePromises);
            }

            await client.query('COMMIT');

            // 4. Send Email (Fire and forget to allow fast redirect)
            if (!isAlreadyPromoted && customerDetails?.email) {
                // Determine if we are running in a serverless environment where background tasks might die
                // For critical emails, we might want to await, but for speed, we skip await.
                // In standard Node (VPS/Container), this is safe. In Vercel, it's risky without waitUntil.
                // To balance, we just log and catch, but don't await the result.

                const emailPromise = (async () => {
                    try {
                        const orderSummaryHtml = `
                            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-xl">
                                <h1 style="color: #4f46e5; text-align: center;">Order Confirmed!</h1>
                                <p>Hi ${customerDetails.name},</p>
                                <p>Thank you for your purchase. Your order <b>#${orderId.slice(0, 8)}</b> has been successfully verified.</p>
                                <p>We'll notify you once it ships.</p>
                            </div>
                        `;
                        await sendMail(
                            customerDetails.email,
                            `Order Confirmed - #${orderId.slice(0, 8)}`,
                            orderSummaryHtml
                        );
                        console.log(`Email sent to ${customerDetails.email}`);
                    } catch (emailErr) {
                        console.error("Email error:", emailErr);
                    }
                })();

                // Do not await emailPromise here
            }

            return NextResponse.json({ success: true, orderId });

        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

    } catch (error: any) {
        console.error('Order Verification Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
