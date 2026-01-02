const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    dotenv.config();
}

async function migrate() {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;
    if (!connectionString) {
        console.error("No database connection string found.");
        process.exit(1);
    }

    const pool = new Pool({ connectionString, ssl: true });

    try {
        console.log("Checking if drop_reason column exists...");
        const checkRes = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='orders' AND column_name='drop_reason';
        `);

        if (checkRes.rows.length === 0) {
            console.log("Adding drop_reason column to orders table...");
            await pool.query('ALTER TABLE orders ADD COLUMN drop_reason TEXT;');
            console.log("Successfully added drop_reason column.");
        } else {
            console.log("drop_reason column already exists.");
        }
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await pool.end();
    }
}

migrate();
