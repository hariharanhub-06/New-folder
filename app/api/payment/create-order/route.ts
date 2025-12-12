
import { NextResponse } from 'next/server';
import { razorpay } from '@/lib/razorpay';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { orderId, amount, customerName, customerEmail, customerPhone } = body;

        if (!orderId || !amount) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Razorpay expects amount in paise (multiply by 100)
        // createOrder options
        const options = {
            amount: Math.round(amount * 100),
            currency: 'INR',
            receipt: orderId, // We use our internal Order ID as the receipt
            notes: {
                shipping_order_id: orderId,
                customer_name: customerName,
                customer_email: customerEmail
            }
        };

        const order = await razorpay.orders.create(options);

        // Return the Razorpay Order ID to the frontend
        return NextResponse.json({
            success: true,
            razorpayOrderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID // Send Key ID so frontend can use it
        });

    } catch (error: any) {
        console.error('Razorpay Order Creation Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to initiate payment' }, { status: 500 });
    }
}
