const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkSpecificProduct() {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;
    const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

    try {
        const res = await pool.query(`
            SELECT id, name, is_offer, is_offer_drop, is_trending, is_active 
            FROM products 
            WHERE name ILIKE '%Old money flip flop%'
        `);
        const fs = require('fs');
        fs.writeFileSync('specific_product_check.txt', JSON.stringify(res.rows, null, 2));
        console.log("Check complete. Results in specific_product_check.txt");
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

checkSpecificProduct();
