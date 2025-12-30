require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function find() {
    await client.connect();
    const res = await client.query("SELECT image_url FROM products WHERE name = 'Mom fit jeans'");
    console.log(`URL: ${res.rows[0].image_url}`);
    await client.end();
}
find();
