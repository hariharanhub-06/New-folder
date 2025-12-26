const { Pool } = require('pg');
require('dotenv').config();

async function migrate() {
    const connectionString = 'postgresql://neondb_owner:npg_3hgCudc2TDEv@ep-spring-star-ahc1v027-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
    const pool = new Pool({ connectionString, ssl: true });

    try {
        console.log('Starting migration...');
        await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT false;');
        console.log('Added is_trending column.');
        await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS is_new_arrival BOOLEAN DEFAULT false;');
        console.log('Added is_new_arrival column.');
        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();
