const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    dotenv.config();
}

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!connectionString) {
    console.error("No DATABASE_URL found in environment");
    process.exit(1);
}

const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

async function migrate() {
    const client = await pool.connect();
    try {
        console.log("Running customer migration...");
        await client.query('BEGIN');

        await client.query(`
            CREATE TABLE IF NOT EXISTS customers (
                id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                mobile VARCHAR(15) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                is_verified BOOLEAN DEFAULT false,
                otp_code VARCHAR(6),
                otp_expires_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("✓ customers table created");

        await client.query(`
            ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id VARCHAR(255) REFERENCES customers(id) ON DELETE SET NULL;
        `);
        console.log("✓ customer_id column added to orders");

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_customers_mobile ON customers(mobile);
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
        `);
        console.log("✓ indexes created");

        await client.query('COMMIT');
        console.log("\nMigration complete.");
    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Migration failed:", e.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
