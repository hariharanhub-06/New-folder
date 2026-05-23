require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function check() {
    try {
        await client.connect();
        const res = await client.query(`
            SELECT 
                CASE 
                    WHEN image_url LIKE '%lzmpwlx08%' THEN 'PRIMARY'
                    WHEN image_url LIKE '%6k5vfwl1j%' THEN 'SECONDARY'
                    ELSE 'OTHER'
                END as account,
                COUNT(*) as count
            FROM products 
            GROUP BY account
        `);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

check();
