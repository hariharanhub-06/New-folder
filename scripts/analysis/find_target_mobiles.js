
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function findMobiles() {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;
    const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

    const targets = ['Balu', 'Srijil', 'Seijil', 'Thamilalagan'];

    try {
        console.log("Searching for mobile numbers...");

        // 1. Search by specific names
        for (const name of targets) {
            const res = await pool.query('SELECT customer_name, customer_email, customer_mobile, status, created_at FROM orders WHERE customer_name ILIKE $1', [`%${name}%`]);
            if (res.rows.length > 0) {
                console.log(`\n--- Results for ${name} ---`);
                res.rows.forEach(r => {
                    console.log(`Name: ${r.customer_name}, Email: ${r.customer_email}, Mobile: ${r.customer_mobile || 'MISSING'}, Status: ${r.status}, Date: ${r.created_at}`);
                });
            }
        }

        // 2. Just list all recent pending with any mobile data
        console.log("\n\n--- Recent Pending Orders with Mobiles ---");
        const pendingRes = await pool.query(`
            SELECT customer_name, customer_email, customer_mobile, status 
            FROM orders 
            WHERE status = 'Pending Payment' 
            AND customer_mobile IS NOT NULL 
            AND customer_mobile != ''
            ORDER BY created_at DESC 
            LIMIT 10
        `);
        pendingRes.rows.forEach(r => {
            console.log(`${r.customer_name}: ${r.customer_mobile} (${r.customer_email})`);
        });

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await pool.end();
    }
}

findMobiles();
