require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function check() {
    try {
        const res = await pool.query('SELECT DISTINCT category FROM products');
        console.log('Categories in DB:', res.rows.map(r => r.category));

        // Let's also count them
        const counts = await pool.query('SELECT category, COUNT(*) FROM products GROUP BY category');
        console.log('Counts:', counts.rows);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

check();
