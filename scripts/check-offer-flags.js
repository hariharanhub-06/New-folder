const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkOfferFlags() {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;
    const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

    try {
        const res = await pool.query(`
            SELECT id, name, is_offer, is_offer_drop, is_trending 
            FROM products 
            WHERE is_offer = true OR is_offer_drop = true OR is_trending = true
            LIMIT 100
        `);
        const fs = require('fs');
        fs.writeFileSync('product_flags_check.txt', JSON.stringify(res.rows, null, 2));
        console.log("Check complete. Results in product_flags_check.txt");
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

checkOfferFlags();
