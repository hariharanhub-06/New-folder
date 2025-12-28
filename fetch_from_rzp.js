
const { Pool } = require('pg');
const Razorpay = require('razorpay');
const fs = require('fs');

require('dotenv').config({ path: '.env.local' });

const RZP_KEY_ID = "qsh62OwLqHVcgL4jp2awKECr";
const RZP_KEY_SECRET = "Ampu@3119";

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

console.log("Using Key:", (process.env.RAZORPAY_KEY_ID || RZP_KEY_ID).substring(0, 5) + "...");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || RZP_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET || RZP_KEY_SECRET,
});

const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

async function run() {
    try {
        const res = await pool.query(`
            SELECT customer_name, customer_email, razorpay_order_id, created_at
            FROM orders 
            WHERE status = 'Pending Payment' 
            ORDER BY created_at DESC
        `);

        console.log(`Checking ${res.rows.length} orders...\n`);

        for (const order of res.rows) {
            process.stdout.write(`Checking ${order.customer_name}... `);
            if (!order.razorpay_order_id) {
                console.log("NO_RZP_ID");
                continue;
            }

            try {
                const payments = await razorpay.orders.fetchPayments(order.razorpay_order_id);
                const mobile = payments.items?.[0]?.contact;

                if (mobile) {
                    console.log(`✅ ${mobile}`);
                } else {
                    console.log("❌ No payments recorded");
                }
            } catch (err) {
                console.log(`⚠️ Error: ${err.error?.description || err.message || JSON.stringify(err)}`);
            }
        }
    } catch (err) {
        console.error("\nMaster Error:", err.message);
    } finally {
        await pool.end();
        process.exit();
    }
}

run();
