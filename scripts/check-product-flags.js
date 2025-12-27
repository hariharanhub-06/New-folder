const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function checkProduct() {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;
    if (!connectionString) {
        console.error("No connection string found. Check .env.local");
        return;
    }
    const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

    try {
        const res = await pool.query("SELECT id, name, is_offer, is_trending, is_new_arrival, is_active FROM products WHERE name ILIKE '%Old money flip flop%'");
        const output = JSON.stringify(res.rows, null, 2);
        console.log("DB_RESULT:", output);
        fs.writeFileSync('product-flags-output.txt', output);
        console.log("\nOutput written to product-flags-output.txt");
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

checkProduct();
