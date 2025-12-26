
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import db from '@/lib/db';
import { sendMail } from '@/lib/email';

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
                    razorpay_order_id, razorpay_payment_id
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `, [
                orderId,
                customerDetails.name,
                customerDetails.email,
                customerDetails.mobile,
                JSON.stringify(shippingAddress),
                totals.grandTotal,
                totals.shippingCost,
                'Payment Confirmed',
                razorpay_order_id,
                razorpay_payment_id
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

            // 3. Send Confirmation Email (Triggered now!)
            try {
                const orderSummaryHtml = `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-xl">
                        <h1 style="color: #4f46e5; text-align: center;">Order Confirmed!</h1>
                        <p>Hi ${customerDetails.name},</p>
                        <p>Thank you for your purchase from <b>Startup Men's Wear</b>. Your order has been successfully placed and is being processed.</p>
                        
                        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Order Details:</h3>
                            <p><b>Order ID:</b> ${orderId.slice(0, 8)}</p>
                            <p><b>Total Amount:</b> ₹${totals.grandTotal.toFixed(2)}</p>
                            <p><b>Delivery to:</b> ${shippingAddress.street}, ${shippingAddress.city}, ${shippingAddress.state}, ${shippingAddress.zipCode}</p>
                        </div>
                        
                        <p>We'll notify you once your parcel is prepared for shipping.</p>
                        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                        <p style="text-align: center; color: #64748b; font-size: 12px;">© 2025 Startup Men's Wear. All rights reserved.</p>
                    </div>
                `;

                await sendMail(
                    customerDetails.email,
                    `Order Confirmed - #${orderId.slice(0, 8)}`,
                    orderSummaryHtml
                ).catch(e => console.error('Email send failed:', e)); // Don't fail the whole request if email fails

            } catch (emailError) {
                console.error('Email dispatch error:', emailError);
            }

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
