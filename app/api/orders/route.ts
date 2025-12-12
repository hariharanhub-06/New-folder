
import { NextResponse } from 'next/server';
import db from '@/lib/db';

// GET: Fetch all orders with their items
export async function GET() {
    try {
        // Fetch all orders
        const ordersRes = await db.query(`
            SELECT * FROM orders ORDER BY created_at DESC
        `);
        const orders = ordersRes.rows;

        // Hydrate items
        // Note: For large datasets, use a JOIN. Keeping it simple as per original logic for now, but parallelizing.
        const ordersWithItems = await Promise.all(orders.map(async (order) => {
            const itemsRes = await db.query(`
                SELECT * FROM order_items WHERE order_id = $1
            `, [order.id]);
            const items = itemsRes.rows;

            return {
                id: order.id,
                customerName: order.customer_name,
                customerEmail: order.customer_email,
                customerMobile: order.customer_mobile,
                shippingAddress: order.shipping_address ? JSON.parse(order.shipping_address) : {},
                totalAmount: parseFloat(order.total_amount),
                shippingCost: parseFloat(order.shipping_cost),
                status: order.status,
                transactionId: order.transaction_id,
                cashfreeOrderId: order.cashfree_order_id,
                cashfreePaymentId: order.cashfree_payment_id,
                logisticsId: order.logistics_id,
                createdAt: order.created_at,
                updatedAt: order.updated_at,
                items: items.map(item => ({
                    id: item.id,
                    productId: item.product_id,
                    name: item.name,
                    quantity: item.quantity,
                    price: parseFloat(item.price),
                })),
            };
        }));

        return NextResponse.json(ordersWithItems);
    } catch (error: any) {
        console.error('Error fetching orders:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Create a new order
export async function POST(request: Request) {
    try {
        const order = await request.json();
        const orderId = order.id || crypto.randomUUID();

        // Transaction
        const client = await db.connect();
        try {
            await client.query('BEGIN');

            const orderId = order.id || crypto.randomUUID();

            // Insert Order
            await client.query(`
                INSERT INTO orders (
                    id, customer_name, customer_email, customer_mobile,
                    shipping_address, total_amount, shipping_cost, status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [
                orderId,
                order.customerName,
                order.customerEmail,
                order.customerMobile,
                JSON.stringify(order.shippingAddress),
                order.totalAmount,
                order.shippingCost || 0,
                'New Order'
            ]);

            for (const item of order.items) {
                await client.query(`
                    INSERT INTO order_items (id, order_id, product_id, name, quantity, price, size)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                `, [
                    crypto.randomUUID(),
                    orderId,
                    item.productId || null,
                    item.name,
                    item.quantity,
                    item.price,
                    (item as any).size || null  // Save size if provided
                ]);
            }

            await client.query('COMMIT');
            return NextResponse.json({ success: true, orderId });

        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

    } catch (error: any) {
        console.error('Error creating order:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT: Update order status
export async function PUT(request: Request) {
    try {
        const { orderId, status, transactionId } = await request.json();

        await db.query(`
            UPDATE orders 
            SET status = $1, transaction_id = $2
            WHERE id = $3
        `, [
            status,
            transactionId || null,
            orderId
        ]);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error updating order:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
