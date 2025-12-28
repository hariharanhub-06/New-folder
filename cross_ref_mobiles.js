
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function crossRef() {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

    const names = ['Balu', 'Srijil', 'Seijil', 'Thamilalagan'];

    try {
        console.log("Cross-referencing customer data...");
        for (const name of names) {
            const res = await pool.query(`
                SELECT customer_name, customer_email, customer_mobile, status, created_at 
                FROM orders 
                WHERE customer_name ILIKE $1 
                AND customer_mobile IS NOT NULL 
                AND customer_mobile != ''
            `, [`%${name}%`]);

            if (res.rows.length > 0) {
                console.log(`\nFound data for ${name}:`);
                res.rows.forEach(r => {
                    console.log(`- ${r.customer_name} | ${r.customer_email} | ${r.customer_mobile} (${r.status})`);
                });
            } else {
                console.log(`\nNo phone records found for ${name}.`);
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

crossRef();
