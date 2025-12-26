const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    try {
        console.log("Adding 'image_url' column to 'order_items' table...");
        await pool.query(`
            ALTER TABLE order_items 
            ADD COLUMN IF NOT EXISTS image_url TEXT;
        `);
        console.log("✅ Column added successfully!");
    } catch (err) {
        console.error("❌ Migration failed:", err);
    } finally {
        await pool.end();
    }
}

migrate();
