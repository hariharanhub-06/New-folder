require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const https = require('https');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

function testUrl(url) {
    return new Promise((resolve) => {
        https.get(url, (res) => {
            resolve(res.statusCode);
        }).on('error', (e) => resolve(e.message));
    });
}

async function verify() {
    try {
        await client.connect();
        const res = await client.query('SELECT name, image_url FROM products LIMIT 5');
        for (const row of res.rows) {
            const status = await testUrl(row.image_url);
            console.log(`${row.name}: ${status}`);
            console.log(`  URL: ${row.image_url}`);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

verify();
