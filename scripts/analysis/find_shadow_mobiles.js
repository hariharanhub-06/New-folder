
const db = require('./lib/db').default;
const Razorpay = require('razorpay');
require('dotenv').config({ path: '.env.local' });

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function findMobileNumbers() {
    try {
        const res = await db.query(`
            SELECT id, customer_name, customer_email, razorpay_order_id, status 
            FROM orders 
            WHERE status = 'Pending Payment' 
            ORDER BY created_at DESC
            LIMIT 10
        `);

        console.log(`Found ${res.rows.length} pending shadow orders.\n`);

        for (const order of res.rows) {
            console.log(`--- Order: ${order.customer_name} (${order.customer_email}) ---`);
            console.log(`Local ID: ${order.id}`);
            console.log(`Razorpay Order ID: ${order.razorpay_order_id || 'N/A'}`);

            if (order.razorpay_order_id) {
                try {
                    // Try to fetch payments for this order
                    const payments = await razorpay.orders.fetchPayments(order.razorpay_order_id);
                    if (payments.items && payments.items.length > 0) {
                        const contact = payments.items[0].contact;
                        console.log(`✅ Found Contact in Payment: ${contact}`);
                    } else {
                        // Check the order notes/details
                        const rzpOrder = await razorpay.orders.fetch(order.razorpay_order_id);
                        // Sometimes prefill is not in the order object itself but in payments
                        console.log(`❌ No payments found for this order ID yet.`);
                    }
                } catch (rzpErr) {
                    console.log(`❌ Razorpay Error: ${rzpErr.message}`);
                }
            } else {
                console.log(`❌ No Razorpay Order ID stored.`);
            }
            console.log('');
        }

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

findMobileNumbers();
