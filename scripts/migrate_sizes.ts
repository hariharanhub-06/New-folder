
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
}

const pool = new Pool({ connectionString, ssl: true });

async function migrate() {
    try {
        console.log("Creating product_sizes table...");
        await pool.query(`
            CREATE TABLE IF NOT EXISTS product_sizes (
                id UUID PRIMARY KEY,
                product_id VARCHAR(255) NOT NULL,
                size VARCHAR(50) NOT NULL,
                stock INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            );
        `);
        console.log("Migration successful: product_sizes table created.");
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await pool.end();
    }
}

migrate();
