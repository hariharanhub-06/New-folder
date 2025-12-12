
import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const orderId = params.id;
        const orderRes = await db.query('SELECT * FROM orders WHERE id = $1', [orderId]);
        const order = orderRes.rows[0];

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Fetch items
        const itemsRes = await db.query('SELECT * FROM order_items WHERE order_id = $1', [orderId]);
        const items = itemsRes.rows;

        const formattedOrder = {
            id: order.id,
            customerName: order.customer_name,
            customerEmail: order.customer_email,
            customerMobile: order.customer_mobile,
            shippingAddress: typeof order.shipping_address === 'string'
                ? JSON.parse(order.shipping_address)
                : order.shipping_address,
            totalAmount: parseFloat(order.total_amount),
            shippingCost: parseFloat(order.shipping_cost),
            status: order.status,
            transactionId: order.transaction_id,
            cashfreeOrderId: order.cashfree_order_id,
            cashfreePaymentId: order.cashfree_payment_id,
            logisticsId: order.logistics_id,
            createdAt: order.created_at,
            updatedAt: order.updated_at,
            items: items.map((item: any) => ({
                id: item.id,
                productId: item.product_id,
                name: item.name,
                quantity: item.quantity,
                price: parseFloat(item.price),
            })),
        };

        return NextResponse.json({ order: formattedOrder });

    } catch (error: any) {
        console.error('Error fetching order:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
