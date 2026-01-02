import crypto from 'crypto';
import db from '@/lib/db';
import { sendMail } from '@/lib/email';

export async function verifyAndPromoteOrder(
    razorpay_order_id: string,
    razorpay_payment_id: string,
    razorpay_signature: string,
    dbOrderId: string,
    customerMobile?: string,
    customerEmail?: string,
    customerName?: string
) {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) throw new Error("Razorpay Secret missing locally");

    // 1. Verify Signature
    const generated_signature = crypto
        .createHmac("sha256", secret)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");

    if (generated_signature !== razorpay_signature) {
        throw new Error('Invalid Payment Signature');
    }

    // 2. Promote Shadow Order
    const client = await db.connect();
    let isAlreadyPromoted = false;

    try {
        await client.query('BEGIN');

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
            dbOrderId,
            customerMobile || ''
        ]);

        if (updateRes.rowCount === 0) {
            const checkRes = await client.query('SELECT status FROM orders WHERE id = $1', [dbOrderId]);
            if (checkRes.rows.length > 0 && checkRes.rows[0].status === 'Payment Confirmed') {
                isAlreadyPromoted = true;
            } else {
                throw new Error('Order not valid for confirmation');
            }
        } else {
            // 3. Decrement Stock
            const itemsRes = await client.query('SELECT product_id, size, quantity FROM order_items WHERE order_id = $1', [dbOrderId]);

            for (const item of itemsRes.rows) {
                if (!item.product_id) continue;

                if (item.size) {
                    await client.query(`
                        UPDATE product_sizes 
                        SET stock = GREATEST(0, stock - $1)
                        WHERE product_id = $2 AND size = $3
                    `, [item.quantity, item.product_id, item.size]);

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

        await client.query('COMMIT');

        // 4. Send Confirmation Email (Async)
        if (!isAlreadyPromoted && customerEmail) {
            (async () => {
                try {
                    const orderSummaryHtml = `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                            <h1 style="color: #4f46e5; text-align: center;">Order Confirmed!</h1>
                            <p>Hi ${customerName || 'Customer'},</p>
                            <p>Thank you for your purchase. Your order <b>#${dbOrderId.slice(0, 8)}</b> has been successfully verified.</p>
                            <p>We'll notify you once it ships.</p>
                        </div>
                    `;
                    await sendMail(
                        customerEmail,
                        `Order Confirmed - #${dbOrderId.slice(0, 8)}`,
                        orderSummaryHtml
                    );
                } catch (emailErr) {
                    console.error("Email error:", emailErr);
                }
            })();
        }

        return { success: true, orderId: dbOrderId };

    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}
