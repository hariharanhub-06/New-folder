
const { Pool } = require('pg');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load env
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function test() {
    try {
        const client = await pool.connect();

        // Insert a dummy product with images if none exists
        // Or just query existing products
        const res = await client.query('SELECT * FROM products LIMIT 1');

        if (res.rows.length === 0) {
            console.log("No products found to test.");
        } else {
            const row = res.rows[0];
            console.log("Row ID:", row.id);
            console.log("Images Type:", typeof row.images);
            console.log("Images Value:", row.images);
            console.log("Is Array?", Array.isArray(row.images));

            try {
                if (typeof row.images === 'string') {
                    console.log("JSON.parse result:", JSON.parse(row.images));
                } else {
                    console.log("Skipping JSON.parse test because it is not a string.");
                }
            } catch (e) {
                console.error("JSON.parse failed:", e.message);
            }
        }

        client.release();
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

test();
