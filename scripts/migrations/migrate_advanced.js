require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function migrate() {
    try {
        console.log('Starting advanced migration...');

        // 1. Create categories table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id TEXT PRIMARY KEY,
                name TEXT UNIQUE NOT NULL,
                image_url TEXT,
                display_order INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Categories table created.');

        // 2. Create site_settings table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS site_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Site settings table created.');

        // 3. Seed initial settings
        const initialSettings = [
            ['announcement_text', 'SPECIAL OFFER: ENJOY 40% OFF ON TWO HOT-SELLING PRODUCTS! SHOP NOW'],
            ['map_embed_url', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3916.482813137688!2d77.000302774351!3d10.9986348891639!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba859f0f972049f%3A0x6b77293a5518b71d!2sStartup%20Mens%20Wear!5e0!3m2!1sen!2sin!4v1734937747805!5m2!1sen!2sin'],
            ['contact_phone', '+91 80151 03119'],
            ['contact_address', '160/1, CAR ST, SOWRI PALAYAM, COIMBATORE, TAMIL NADU 641028']
        ];

        for (const [key, value] of initialSettings) {
            await pool.query(`
                INSERT INTO site_settings (key, value) 
                VALUES ($1, $2) 
                ON CONFLICT (key) DO NOTHING
            `, [key, value]);
        }
        console.log('Initial settings seeded.');

        // 4. Migrate existing categories from products table to categories table
        const categoriesRes = await pool.query('SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != \'\'');
        for (const row of categoriesRes.rows) {
            await pool.query(`
                INSERT INTO categories (id, name) 
                VALUES ($1, $2) 
                ON CONFLICT (name) DO NOTHING
            `, [row.category.toLowerCase().replace(/\s+/g, '-'), row.category]);
        }
        console.log('Existing categories migrated.');

        console.log('Advanced migration complete!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();
