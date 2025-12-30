require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function get() {
    try {
        await client.connect();
        const res = await client.query('SELECT image_url FROM products LIMIT 1');
        console.log(res.rows[0].image_url);
    } finally {
        await client.end();
    }
}
get();
