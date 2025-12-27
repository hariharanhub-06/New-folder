const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function addOfferDropColumn() {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;
    if (!connectionString) {
        console.error("No connection string found. Check .env.local");
        return;
    }
    const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

    try {
        console.log("Adding is_offer_drop column to products table...");
        await pool.query(`
            ALTER TABLE products 
            ADD COLUMN IF NOT EXISTS is_offer_drop BOOLEAN DEFAULT false
        `);
        console.log("✓ Successfully added is_offer_drop column");

        // Optionally migrate existing is_trending to is_offer_drop
        // Uncomment if you want existing trending products to appear in offer drops
        // await pool.query(`UPDATE products SET is_offer_drop = is_trending WHERE is_trending = true`);
        // console.log("✓ Migrated existing trending products to offer drops");
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await pool.end();
    }
}

addOfferDropColumn();
