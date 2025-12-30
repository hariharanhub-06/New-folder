require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await client.connect();
        const res = await client.query("SELECT image_url FROM products WHERE name ILIKE '%Mom fit%' LIMIT 1");
        if (res.rows.length > 0) {
            console.log('FINAL URL:');
            console.log(res.rows[0].image_url);
        } else {
            console.log('Not found');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
run();
