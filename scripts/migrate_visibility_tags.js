
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Basic .env parser
function loadEnv() {
    const envPath = path.join(__dirname, '..', '.env.local');
    if (!fs.existsSync(envPath)) return;
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    lines.forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
        }
    });
}

loadEnv();

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!connectionString) {
    console.error("DATABASE_URL not found");
    process.exit(1);
}

const pool = new Pool({ connectionString, ssl: true });

async function migrate() {
    try {
        console.log("Checking columns...");
        await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS visibility_tags JSONB DEFAULT '[]'::jsonb");
        console.log("Column visibility_tags ensures.");

        console.log("Renaming category 'Pant' to 'Bottoms'...");
        const res = await pool.query("UPDATE products SET category = 'Bottoms' WHERE category = 'Pant'");
        console.log(`Renamed ${res.rowCount} products.`);

        // Also update categories table if it exists
        const tableCheck = await pool.query("SELECT FROM information_schema.tables WHERE table_name = 'categories'");
        if (tableCheck.rowCount > 0) {
            await pool.query("UPDATE categories SET name = 'Bottoms', id = 'bottoms' WHERE name = 'Pant' OR id = 'pant'");
            console.log("Updated categories table.");
        }

        console.log("Migration complete.");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await pool.end();
    }
}

migrate();
