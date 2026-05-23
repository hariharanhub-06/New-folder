const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });

async function migrate() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS customer_addresses (
            id VARCHAR(255) PRIMARY KEY,
            customer_id VARCHAR(255) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
            label VARCHAR(50) DEFAULT 'Home',
            name VARCHAR(255) NOT NULL,
            mobile VARCHAR(15) NOT NULL,
            street VARCHAR(500) NOT NULL,
            city VARCHAR(100) NOT NULL,
            state VARCHAR(100) NOT NULL,
            country VARCHAR(100) DEFAULT 'India',
            pincode VARCHAR(10) NOT NULL,
            is_default BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_id ON customer_addresses(customer_id);
    `);
    console.log('✓ customer_addresses table ready');
    await pool.end();
}

migrate().catch(err => { console.error(err); process.exit(1); });
