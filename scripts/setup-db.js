
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    dotenv.config();
}

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
    console.error("No connection string found!");
    process.exit(1);
}

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function setup() {
    const client = await pool.connect();
    try {
        console.log("Setting up database schema...");

        await client.query('BEGIN');

        // Admins Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS admins (
                id VARCHAR(255) PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Products Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS products (
                id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                price DECIMAL(10, 2) NOT NULL,
                category VARCHAR(255),
                stock INTEGER DEFAULT 0,
                image_url TEXT,
                images JSONB DEFAULT '[]',
                is_active BOOLEAN DEFAULT true,
                size VARCHAR(255),
                weight INTEGER DEFAULT 750,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Product Sizes Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS product_sizes (
                id VARCHAR(255) PRIMARY KEY,
                product_id VARCHAR(255) REFERENCES products(id) ON DELETE CASCADE,
                size VARCHAR(50) NOT NULL,
                stock INTEGER DEFAULT 0
            );
        `);

        // Discounts Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS discounts (
                id VARCHAR(255) PRIMARY KEY,
                product_id VARCHAR(255), 
                quantity INTEGER,
                price DECIMAL(10, 2),
                discount_type VARCHAR(50), -- 'percentage' or 'bundle'
                target_type VARCHAR(50),   -- 'product' or 'category'
                category VARCHAR(255),
                percentage INTEGER,
                active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Orders Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id VARCHAR(255) PRIMARY KEY,
                customer_name VARCHAR(255),
                customer_email VARCHAR(255),
                customer_mobile VARCHAR(50),
                shipping_address TEXT,
                total_amount DECIMAL(10, 2),
                shipping_cost DECIMAL(10, 2) DEFAULT 0,
                status VARCHAR(50) DEFAULT 'Pending',
                transaction_id VARCHAR(255),
                cashfree_order_id VARCHAR(255),
                cashfree_payment_id VARCHAR(255),
                logistics_id VARCHAR(255),
                courier_name VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Order Items Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS order_items (
                id SERIAL PRIMARY KEY,
                order_id VARCHAR(255) REFERENCES orders(id) ON DELETE CASCADE,
                product_id VARCHAR(255),
                name VARCHAR(255),
                quantity INTEGER,
                price DECIMAL(10, 2)
            );
        `);

        await client.query('COMMIT');
        console.log("Schema creation successful.");
    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Schema setup failed:", e);
        process.exit(1);
    } finally {
        client.release();
    }
}

setup().then(() => {
    // Check if we need to seed default admin
    // We can run the existing seed manual script for that if preferred, 
    // or just exit and let the user run seed.
    // Let's run seed-manual.js via require if possible or just suggest it.
    // For now, standalone setup is safer.
    process.exit(0);
});
