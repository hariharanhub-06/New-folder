
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import db from '@/lib/db';
import { verifyAndPromoteOrder } from '@/lib/order-utils';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            paymentDetails,
            orderId,
            customerDetails
        } = body;

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentDetails;

        if (!razorpay_payment_id || !razorpay_signature || !orderId) {
            return NextResponse.json({ error: 'Missing payment or order details' }, { status: 400 });
        }

        const result = await verifyAndPromoteOrder(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            orderId,
            customerDetails?.mobile,
            customerDetails?.email,
            customerDetails?.name
        );

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Order Verification Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
