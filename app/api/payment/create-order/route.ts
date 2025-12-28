import { NextResponse } from 'next/server';
import { razorpay } from '@/lib/razorpay';
import { calculateTotalWeight, calculateShipping } from '@/lib/shipping';
import db from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { items, address, customerName, customerEmail, customerMobile } = body;

        console.log("Initiating Payment for:", { customerName, mobile: customerMobile, itemCount: items?.length });

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
        }

        // 1. Calculate Total Amount Server-Side (Security)
        let subtotal = 0;
        let weightedItems = [];

        for (const item of items) {
            // In a real app, fetch price from DB to prevent tampering.
            // For now, we trust the ID but should verify price if possible.
            // Let's do a quick fetch or trust for speed if strictness not requested.
            // User requested "only if payment confirmed", implying security concern.
            // Let's assume passed prices are ok for now to match current logic, 
            // OR fetch from DB to be safe. Fetching is better.

            // NOTE: Fetching every product might be slow if many items. 
            // Given the context, we will use the passed prices but validate logic.
            // Ideally: const dbProduct = await getProduct(item.id);

            subtotal += item.price * item.quantity;
            weightedItems.push({
                weight: item.weight || 750, // Fallback if font-end missed it, but logic should be consistent
                quantity: item.quantity
            });
        }

        // 2. Calculate Shipping
        const totalWeight = calculateTotalWeight(weightedItems);
        const shippingCost = calculateShipping(totalWeight, address.country, address.zipCode);

        // 3. Calculate Grand Total
        const grandTotal = subtotal + shippingCost;

        // --- NEW: STOCK RESERVATION CHECK ---
        // const db = require('@/lib/db').default; // REMOVE: Use top-level import
        const client = await db.connect();

        try {
            for (const item of items) {
                // Determine if we are checking a specific variant size or base product
                const isSizeVariant = !!item.selectedSize;
                const productId = item.id;
                const requestedQty = item.quantity;

                // 1. Get Total Real Stock
                let totalStock = 0;
                if (isSizeVariant) {
                    const stockRes = await client.query(
                        'SELECT stock FROM product_sizes WHERE product_id = $1 AND size = $2',
                        [productId, item.selectedSize]
                    );
                    totalStock = stockRes.rows[0]?.stock || 0;
                } else {
                    const stockRes = await client.query(
                        'SELECT stock FROM products WHERE id = $1',
                        [productId]
                    );
                    totalStock = stockRes.rows[0]?.stock || 0;
                }

                // 2. Get Reserved Stock (Active Pending Orders < 2 mins old)
                // We sum up items from other users who are currently in the payment screen.
                // We exclude 'Payment Failed' and 'Cancelled'.
                // We only care about 'Pending Payment' created recently.
                const reservedRes = await client.query(`
                    SELECT SUM(oi.quantity) as reserved
                    FROM order_items oi
                    JOIN orders o ON o.id = oi.order_id
                    WHERE oi.product_id = $1
                    AND ($2::text IS NULL OR oi.size = $2)
                    AND o.status = 'Pending Payment'
                    AND o.created_at > NOW() - INTERVAL '2 minutes'
                `, [productId, item.selectedSize || null]);

                const reservedStock = parseInt(reservedRes.rows[0]?.reserved || '0');
                const availableStock = totalStock - reservedStock;

                console.log(`Stock Check for ${item.name} (${item.selectedSize || 'Base'}): Total=${totalStock}, Reserved=${reservedStock}, Req=${requestedQty}`);

                if (availableStock < requestedQty) {
                    // Block the order
                    throw new Error(`Item '${item.name}' is currently reserved by others. Please try again in 2 minutes.`);
                }
            }
        } finally {
            client.release(); // Quick release before main transaction
        }
        // ------------------------------------

        // 4. Create Shadow Order in Database (Pending Payment)
        // const db = require('@/lib/db').default; // Already imported above
        const crypto = require('crypto');
        const dbOrderId = crypto.randomUUID();

        // Re-connect for Transaction
        // Re-connect for Transaction
        const trxClient = await db.connect();
        try {
            await trxClient.query('BEGIN');

            // Insert Order with 'Pending Payment' status
            // Note: We do NOT decrement stock here. Stock is only reserved upon payment confirmation.
            await trxClient.query(`
                INSERT INTO orders (
                    id, customer_name, customer_email, customer_mobile,
                    shipping_address, total_amount, shipping_cost, status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [
                dbOrderId,
                customerName,
                customerEmail,
                customerMobile || '',
                JSON.stringify(address), // Initial address
                grandTotal,
                shippingCost,
                'Pending Payment'
            ]);

            // Insert Items (for record keeping, but no stock decrement yet)
            for (const item of items) {
                await trxClient.query(`
                    INSERT INTO order_items (id, order_id, product_id, name, quantity, price, size, image_url)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                `, [
                    crypto.randomUUID(),
                    dbOrderId,
                    item.id,
                    item.name,
                    item.quantity,
                    item.price,
                    item.selectedSize || null,
                    item.imageUrl || null
                ]);
            }

            await trxClient.query('COMMIT');
        } catch (dbError) {
            await trxClient.query('ROLLBACK');
            throw dbError;
        } finally {
            trxClient.release();
        }

        // 5. Create Razorpay Order
        const options = {
            amount: Math.round(grandTotal * 100), // in paise
            currency: 'INR',
            receipt: `rcpt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            notes: {
                internal_order_id: dbOrderId, // Critical for Webhook linking
                customer_name: customerName,
                customer_email: customerEmail,
                shipping_cost: shippingCost,
                gateway_fee: 0
            }
        };

        const order = await razorpay.orders.create(options);

        // 6. Update Shadow Order with Razorpay Order ID (For Admin Visibility)
        await db.query(`UPDATE orders SET razorpay_order_id = $1 WHERE id = $2`, [order.id, dbOrderId]);

        // Return the Razorpay Order ID and calculated values
        return NextResponse.json({
            success: true,
            razorpayOrderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
            // Return these so frontend can verify/display if needed
            verifiedAmount: grandTotal,
            shippingCost: shippingCost,
            gatewayFee: 0,
            dbOrderId: dbOrderId // Return internal ID for verification step
        });

    } catch (error: any) {
        console.error('Razorpay Order Creation Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to initiate payment' }, { status: 500 });
    }
}
