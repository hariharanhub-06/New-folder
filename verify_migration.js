const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

function loadEnv() {
    const envPath = path.join(__dirname, '.env.local');
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
const pool = new Pool({ connectionString, ssl: true });

async function check() {
    try {
        console.log("Checking products table schema...");
        const columns = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'products' 
            AND column_name = 'visibility_tags'
        `);
        console.log("Column visibility_tags:", columns.rows);

        console.log("\nChecking categories...");
        const categories = await pool.query(`
            SELECT DISTINCT category, count(*) 
            FROM products 
            GROUP BY category
        `);
        console.log("Categories distribution:", categories.rows);

        console.log("\nChecking products with visibility_tags...");
        const withTags = await pool.query(`
            SELECT id, name, category, visibility_tags 
            FROM products 
            WHERE visibility_tags IS NOT NULL AND visibility_tags != '[]'::jsonb
            LIMIT 5
        `);
        console.log("Products with tags:", withTags.rows);

    } catch (err) {
        console.error("Check failed:", err);
    } finally {
        await pool.end();
    }
}

check();
