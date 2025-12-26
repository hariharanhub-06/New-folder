
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkLatestOrders() {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;
    const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });


    try {
        const res = await pool.query("SELECT id, customer_name, total_amount, status, created_at, razorpay_payment_id FROM orders WHERE created_at >= '2025-12-26 00:00:00' ORDER BY created_at DESC");
        console.log("ORDERS_FROM_TODAY:");
        res.rows.forEach(r => {
            console.log(`- ID: ${r.id}, Customer: ${r.customer_name}, Amount: ${r.total_amount}, Status: ${r.status}, Created: ${r.created_at}, RazorpayID: ${r.razorpay_payment_id}`);
        });
        if (res.rows.length === 0) console.log("No orders found for today.");
    } catch (err) {

        console.error("Error:", err.message);
    } finally {
        await pool.end();
    }
}

checkLatestOrders();
