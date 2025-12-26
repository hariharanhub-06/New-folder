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

async function resetAllOffers() {
    try {
        console.log("Resetting ALL products' is_offer to false...\n");
        const client = await pool.connect();
        try {
            const result = await client.query(`
                UPDATE products 
                SET is_offer = false 
                WHERE is_offer = true
                RETURNING id, name
            `);

            console.log(`Reset ${result.rowCount} products:\n`);
            result.rows.forEach((row, idx) => {
                console.log(`${idx + 1}. ${row.name} (${row.id})`);
            });

            console.log("\n✅ All offer flags have been reset to false.");
            console.log("Go to Admin Panel -> Products and click the star icon next to products you want to mark as offers.");

        } finally {
            client.release();
        }
    } catch (e) {
        console.error("Update failed:", e);
    } finally {
        await pool.end();
    }
}

resetAllOffers();
