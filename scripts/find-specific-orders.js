
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function findSpecificOrders() {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;
    const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

    const targetIds = [
        'pay_RwAVHzRhffYxDA',
        'pay_Rw8EEHfsop4jMH',
        'pay_Rw442RyyTlgX0Z'
    ];

    try {
        console.log("Searching for specific Razorpay IDs...");
        for (const id of targetIds) {
            const res = await pool.query('SELECT * FROM orders WHERE razorpay_payment_id = $1 OR transaction_id = $1', [id]);
            if (res.rows.length > 0) {
                console.log(`Found ID ${id}:`, JSON.stringify(res.rows[0], null, 2));
            } else {
                console.log(`ID ${id} NOT found in orders table.`);
            }
        }

        // Also check if they are in ANY table as a text search?
        // Let's just check the orders table for now.
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await pool.end();
    }
}

findSpecificOrders();
