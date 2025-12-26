const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;

if (!connectionString) {
    console.error("No database connection string found!");
    process.exit(1);
}

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function checkOfferProducts() {
    try {
        console.log("Checking products with is_offer = true...\n");
        const client = await pool.connect();
        try {
            const result = await client.query(`
                SELECT id, name, is_offer, is_active 
                FROM products 
                WHERE is_offer = true
                ORDER BY created_at DESC
            `);

            console.log(`Found ${result.rows.length} products with is_offer = true:\n`);
            result.rows.forEach((row, idx) => {
                console.log(`${idx + 1}. ${row.name}`);
                console.log(`   ID: ${row.id}`);
                console.log(`   is_offer: ${row.is_offer}`);
                console.log(`   is_active: ${row.is_active}`);
                console.log('');
            });

            if (result.rows.length === 0) {
                console.log("No products are currently marked as offers.");
                console.log("Use the Admin Panel to click the star icon next to products to mark them as offers.");
            }

        } finally {
            client.release();
        }
    } catch (e) {
        console.error("Query failed:", e);
    } finally {
        await pool.end();
    }
}

checkOfferProducts();
