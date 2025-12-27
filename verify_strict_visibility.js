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

async function verify() {
    try {
        console.log("--- Strict Visibility Verification ---\n");

        // 1. Check for products with multiple tags
        const products = await pool.query(`
            SELECT id, name, visibility_tags 
            FROM products 
            WHERE visibility_tags IS NOT NULL AND visibility_tags != '[]'::jsonb
            LIMIT 10
        `);

        if (products.rows.length === 0) {
            console.log("No tagged products found yet. Please tag some in admin.");
        } else {
            for (const p of products.rows) {
                console.log(`Product: ${p.name}`);
                console.log(`Tags: ${JSON.stringify(p.visibility_tags)}`);

                // Simulate 'Formal Shirts' filter
                const formalTag = 'formal-shirts';
                const hasFormal = p.visibility_tags.includes(formalTag);
                console.log(`- Would show in 'Formal Shirts'? ${hasFormal ? 'YES' : 'NO'}`);

                // Simulate 'New Arrivals' filter
                const newsTag = 'new-arrivals';
                const hasNews = p.visibility_tags.includes(newsTag);
                console.log(`- Would show in 'New Arrivals'? ${hasNews ? 'YES' : 'NO'}`);

                // Simulate 'General' view (no tag)
                const wouldShowGeneral = !p.visibility_tags || p.visibility_tags.length === 0;
                console.log(`- Would show in 'General Shop'? ${wouldShowGeneral ? 'YES' : 'NO'}\n`);
            }
        }

    } catch (err) {
        console.error("Verification failed:", err);
    } finally {
        await pool.end();
    }
}

verify();
