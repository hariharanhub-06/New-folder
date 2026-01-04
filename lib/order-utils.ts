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
                    // Fetch full item details for the invoice
                    const itemsFullRes = await client.query('SELECT * FROM order_items WHERE order_id = $1', [dbOrderId]);
                    const orderRes = await client.query('SELECT total_amount, shipping_cost FROM orders WHERE id = $1', [dbOrderId]);
                    const { total_amount, shipping_cost } = orderRes.rows[0];

                    const itemsHtml = itemsFullRes.rows.map(item => `
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #edf2f7; font-size: 14px; color: #1a202c;">
                                <div style="display: flex; align-items: center;">
                                    ${item.image_url ? `<img src="${item.image_url}" alt="${item.name}" style="width: 40px; height: 40px; border-radius: 4px; object-fit: cover; margin-right: 12px; border: 1px solid #e2e8f0;">` : ''}
                                    <span>${item.name}${item.size ? ` (Size: ${item.size})` : ''}</span>
                                </div>
                            </td>
                            <td style="padding: 12px; border-bottom: 1px solid #edf2f7; text-align: center; font-size: 14px; color: #1a202c;">${item.quantity}</td>
                            <td style="padding: 12px; border-bottom: 1px solid #edf2f7; text-align: right; font-size: 14px; color: #1a202c;">₹${item.price.toFixed(2)}</td>
                        </tr>
                    `).join('');

                    const whatsappMsg = encodeURIComponent(`Hi Startup Mens Wear! My order #${dbOrderId.slice(0, 8)} is confirmed. Total: ₹${total_amount}`);
                    const whatsappUrl = `https://wa.me/918015103119?text=${whatsappMsg}`;

                    const invoiceHtml = `
                        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                            <div style="background-color: #1a1a1a; padding: 30px; text-align: center; color: #ffffff;">
                                <h1 style="margin: 0; font-size: 24px; letter-spacing: 2px;">STARTUP MENS WEAR</h1>
                                <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.8;">ORDER CONFIRMED</p>
                            </div>
                            
                            <div style="padding: 30px;">
                                <p style="font-size: 16px; color: #2d3748; margin-bottom: 20px;">Hi <b>${customerName || 'Customer'}</b>,</p>
                                <p style="font-size: 14px; color: #4a5568; line-height: 1.6; margin-bottom: 30px;">
                                    Your order <b>#${dbOrderId.slice(0, 8)}</b> has been successfully verified and is now being prepared for shipping.
                                </p>
                                
                                <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                                    <thead>
                                        <tr style="background-color: #f8fafc;">
                                            <th style="padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #718096; border-bottom: 2px solid #e2e8f0;">Item</th>
                                            <th style="padding: 12px; text-align: center; font-size: 12px; text-transform: uppercase; color: #718096; border-bottom: 2px solid #e2e8f0;">Qty</th>
                                            <th style="padding: 12px; text-align: right; font-size: 12px; text-transform: uppercase; color: #718096; border-bottom: 2px solid #e2e8f0;">Price</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${itemsHtml}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colspan="2" style="padding: 12px; text-align: right; font-size: 14px; color: #718096;">Shipping</td>
                                            <td style="padding: 12px; text-align: right; font-size: 14px; color: #1a202c;">₹${shipping_cost.toFixed(2)}</td>
                                        </tr>
                                        <tr style="font-weight: bold;">
                                            <td colspan="2" style="padding: 12px; text-align: right; font-size: 16px; color: #1a202c; border-top: 2px solid #e2e8f0;">Total</td>
                                            <td style="padding: 12px; text-align: right; font-size: 16px; color: #4f46e5; border-top: 2px solid #e2e8f0;">₹${total_amount.toFixed(2)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                                
                                <div style="text-align: center; margin-top: 40px;">
                                    <a href="${whatsappUrl}" style="display: inline-block; padding: 14px 28px; background-color: #25D366; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                        Confirm on WhatsApp
                                    </a>
                                </div>
                            </div>
                            
                            <div style="background-color: #f7fafc; padding: 20px; text-align: center; border-top: 1px solid #edf2f7;">
                                <p style="margin: 0; font-size: 12px; color: #a0aec0;">Questions? Contact us at +91 80151 03119</p>
                                <p style="margin: 5px 0 0 0; font-size: 12px; color: #a0aec0;">&copy; ${new Date().getFullYear()} Startup Mens Wear</p>
                            </div>
                        </div>
                    `;

                    await sendMail(
                        customerEmail,
                        `Invoice for Order #${dbOrderId.slice(0, 8)} - Startup Mens Wear`,
                        invoiceHtml
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
