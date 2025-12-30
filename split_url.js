require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    await client.connect();
    const res = await client.query("SELECT image_url FROM products WHERE name ILIKE '%Mom fit%' LIMIT 1");
    if (res.rows.length > 0) {
        const url = res.rows[0].image_url;
        console.log('PART 1:', url.substring(0, 50));
        console.log('PART 2:', url.substring(50, 100));
        console.log('PART 3:', url.substring(100));
    }
    await client.end();
}
run();
