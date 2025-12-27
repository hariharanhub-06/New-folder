const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function checkCategories() {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;
    if (!connectionString) {
        console.error("No connection string found. Check .env.local");
        return;
    }
    const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

    try {
        const res = await pool.query("SELECT id, name, image_url, is_active, created_at FROM categories ORDER BY created_at DESC LIMIT 10");
        const output = JSON.stringify(res.rows, null, 2);
        console.log("ALL CATEGORIES:", output);
        fs.writeFileSync('all-categories-output.txt', output);
        console.log("\nOutput written to all-categories-output.txt");
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

checkCategories();
