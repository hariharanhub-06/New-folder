import { NextResponse } from 'next/server';
import { razorpay } from '@/lib/razorpay';
import db from '@/lib/db';

export async function POST(request: Request) {
    try {
        const { orderId } = await request.json();

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
        }

        // 1. Fetch Order Details
        const orderRes = await db.query(
            'SELECT total_amount, customer_name, customer_email, customer_mobile FROM orders WHERE id = $1',
            [orderId]
        );

        if (orderRes.rows.length === 0) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const order = orderRes.rows[0];

        // 2. Generate Payment Link
        // Expiry: 1 day from now (optional)
        // const expireBy = Math.floor(Date.now() / 1000) + (24 * 60 * 60);

        const linkOptions = {
            amount: Math.round(order.total_amount * 100), // Amount in paise
            currency: "INR",
            accept_partial: false,
            description: `Payment for Order #${orderId.slice(0, 8)}`,
            customer: {
                name: order.customer_name,
                email: order.customer_email,
                contact: order.customer_mobile
            },
            notify: {
                sms: true,
                email: true
            },
            reminder_enable: true,
            notes: {
                internal_order_id: orderId // CRITICAL: Used by Webhook to identify order
            },
            callback_method: "get"
        };

        const paymentLink = await razorpay.paymentLink.create(linkOptions);

        return NextResponse.json({
            success: true,
            short_url: paymentLink.short_url,
            id: paymentLink.id
        });

    } catch (error: any) {
        console.error('Generate Payment Link Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to create link' }, { status: 500 });
    }
}
