const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkColumnValues() {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;
    const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

    try {
        console.log("Checking is_offer_drop column distribution...");
        const res = await pool.query(`
            SELECT is_offer_drop, COUNT(*) 
            FROM products 
            GROUP BY is_offer_drop
        `);
        const schemaRes = await pool.query(`
            SELECT column_name, data_type, column_default, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'products' AND column_name = 'is_offer_drop'
        `);
        const fs = require('fs');
        fs.writeFileSync('column_distribution_check.txt', JSON.stringify({ distribution: res.rows, schema: schemaRes.rows }, null, 2));
        console.log("Check complete. Results in column_distribution_check.txt");

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

checkColumnValues();
