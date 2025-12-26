
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

async function runMigration() {
    try {
        console.log("Connecting to database...");
        const client = await pool.connect();
        try {
            console.log("Adding is_offer column to products table...");
            await client.query(`
                ALTER TABLE products 
                ADD COLUMN IF NOT EXISTS is_offer BOOLEAN DEFAULT FALSE;
            `);
            console.log("Successfully added is_offer column.");

            // Just to be sure, update nulls to false
            await client.query(`
                UPDATE products SET is_offer = false WHERE is_offer IS NULL;
            `);
            console.log("Updated null values to false.");

        } finally {
            client.release();
        }
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        await pool.end();
    }
}

runMigration();
