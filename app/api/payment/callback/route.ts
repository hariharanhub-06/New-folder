import { NextResponse } from 'next/server';
import { verifyAndPromoteOrder } from '@/lib/order-utils';
import db from '@/lib/db';

export async function POST(request: Request) {
    let dbOrderId: string | null = null;
    try {
        const formData = await request.formData();
        const razorpay_payment_id = formData.get('razorpay_payment_id') as string;
        const razorpay_order_id = formData.get('razorpay_order_id') as string;
        const razorpay_signature = formData.get('razorpay_signature') as string;

        // Get dbOrderId from query params (appended manually in checkout)
        const url = new URL(request.url);
        dbOrderId = url.searchParams.get('dbOrderId');

        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !dbOrderId) {
            return NextResponse.redirect(new URL('/payment/error?error=missing_params', request.url));
        }

        // Fetch basic customer info for email (since verifyAndPromoteOrder doesn't fetch it from DB to keep it lean)
        const orderRes = await db.query('SELECT customer_email, customer_name, customer_mobile FROM orders WHERE id = $1', [dbOrderId]);
        const orderData = orderRes.rows[0];

        await verifyAndPromoteOrder(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            dbOrderId,
            orderData?.customer_mobile,
            orderData?.customer_email,
            orderData?.customer_name
        );

        return NextResponse.redirect(new URL(`/payment/success?orderId=${dbOrderId}`, request.url), 303);

    } catch (error: any) {
        console.error('Razorpay Callback Error:', error);

        // Log drop reason
        if (dbOrderId) {
            try {
                await db.query(`UPDATE orders SET drop_reason = $1 WHERE id = $2 AND status = 'Pending Payment'`, [error.message || 'Payment Callback Error', dbOrderId]);
            } catch (dbErr) {
                console.error('Failed to log drop reason:', dbErr);
            }
        }

        return NextResponse.redirect(new URL(`/payment/error?error=${encodeURIComponent(error.message)}`, request.url), 303);
    }
}

// Also handle GET just in case (though POST is default for Razorpay redirect)
export async function GET(request: Request) {
    const url = new URL(request.url);
    const razorpay_payment_id = url.searchParams.get('razorpay_payment_id');
    const razorpay_order_id = url.searchParams.get('razorpay_order_id');
    const razorpay_signature = url.searchParams.get('razorpay_signature');
    const dbOrderId = url.searchParams.get('dbOrderId');

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !dbOrderId) {
        return NextResponse.redirect(new URL('/payment/error?error=missing_params', request.url));
    }

    try {
        const orderRes = await db.query('SELECT customer_email, customer_name, customer_mobile FROM orders WHERE id = $1', [dbOrderId]);
        const orderData = orderRes.rows[0];

        await verifyAndPromoteOrder(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            dbOrderId,
            orderData?.customer_mobile,
            orderData?.customer_email,
            orderData?.customer_name
        );

        return NextResponse.redirect(new URL(`/payment/success?orderId=${dbOrderId}`, request.url));
    } catch (error: any) {
        console.error('Razorpay Callback GET Error:', error);

        if (dbOrderId) {
            try {
                await db.query(`UPDATE orders SET drop_reason = $1 WHERE id = $2 AND status = 'Pending Payment'`, [error.message || 'Payment Callback Error', dbOrderId]);
            } catch (dbErr) {
                console.error('Failed to log drop reason:', dbErr);
            }
        }

        return NextResponse.redirect(new URL(`/payment/error?error=${encodeURIComponent(error.message)}`, request.url));
    }
}
