const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkRecentImage() {
    try {
        const res = await pool.query('SELECT name, image_url, updated_at FROM products ORDER BY updated_at DESC LIMIT 1');
        console.log("Most Recent Product:", JSON.stringify(res.rows[0], null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

checkRecentImage();
