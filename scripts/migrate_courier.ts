
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
}

const pool = new Pool({ connectionString, ssl: true });

async function migrate() {
    try {
        console.log("Adding courier_name column to orders table...");
        await pool.query(`
            ALTER TABLE orders 
            ADD COLUMN IF NOT EXISTS courier_name VARCHAR(255);
        `);
        console.log("Migration successful: courier_name column added.");
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await pool.end();
    }
}

migrate();
