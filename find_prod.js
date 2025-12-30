require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function find() {
    await client.connect();
    const res = await client.query("SELECT name, image_url FROM products WHERE image_url LIKE '%1766868296506%'");
    console.log(JSON.stringify(res.rows, null, 2));
    await client.end();
}
find();
