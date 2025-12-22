
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables manually
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    dotenv.config(); // Fallback
}

console.log("Loaded Env Keys:", Object.keys(process.env).filter(k => k.includes('DB') || k.includes('URL')));

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;

if (!connectionString) {
    console.error("No connection string found!");
    process.exit(1);
}

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false } // Required for some providers like Neon/Vercel
});

const products = [
    {
        id: 'demo-shirt-1',
        name: 'Premium Cotton Shirt',
        description: 'High-quality cotton shirt suitable for formal and casual wear.',
        price: 1299,
        category: 'Shirts',
        stock: 50,
        imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=2070&auto=format&fit=crop',
        isActive: true, // boolean
        size: "M",
        images: []
    },
    {
        id: 'demo-pant-1',
        name: 'Slim Fit Chinos',
        description: 'Comfortable and stylish chinos for the modern man.',
        price: 1499,
        category: 'Pants',
        stock: 40,
        imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1897&auto=format&fit=crop',
        isActive: true,
        size: "32",
        images: []
    },
    {
        id: 'demo-jacket-1',
        name: 'Classic Denim Jacket',
        description: 'A timeless classic that goes with everything.',
        price: 2499,
        category: 'Jackets',
        stock: 25,
        imageUrl: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?q=80&w=1887&auto=format&fit=crop',
        isActive: true,
        size: "L",
        images: []
    }
];

async function seed() {
    try {
        console.log("Connecting to DB...");
        const client = await pool.connect();
        console.log("Connected.");

        for (const p of products) {
            console.log(`Seeding: ${p.name}`);

            // Upsert Product
            await client.query(`
                INSERT INTO products (id, name, description, price, category, stock, image_url, is_active, size, images)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT (id) DO UPDATE 
                SET name = $2, description = $3, price = $4, category = $5, stock = $6, image_url = $7, is_active = $8
            `, [p.id, p.name, p.description, p.price, p.category, p.stock, p.imageUrl, p.isActive, p.size, JSON.stringify(p.images)]);
        }

        // Seed Admin is handled by lib/db but let's ensure it here just into default
        await client.query(`
            INSERT INTO admins (id, username, password) VALUES ('default-admin', 'admin', 'admin123')
            ON CONFLICT DO NOTHING
        `);
        console.log("Admin ensured.");

        client.release();
        console.log("Seeding Complete.");
        process.exit(0);
    } catch (e) {
        console.error("Seeding Failed:", e);
        process.exit(1);
    }
}

seed();
