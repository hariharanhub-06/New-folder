
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function listPending() {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

    try {
        const res = await pool.query("SELECT customer_name, customer_email, customer_mobile, status FROM orders WHERE status = 'Pending Payment'");
        console.log("NAME | EMAIL | MOBILE");
        console.log("-----------------------");
        res.rows.forEach(r => {
            console.log(`${r.customer_name} | ${r.customer_email} | ${r.customer_mobile || 'MISSING'}`);
        });
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

listPending();
