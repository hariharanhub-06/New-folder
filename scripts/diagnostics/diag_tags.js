const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

function loadEnv() {
    const envPath = path.join(__dirname, '.env.local');
    if (!fs.existsSync(envPath)) return;
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    lines.forEach(line => {
        const [key, ...vParts] = line.split('=');
        if (key && vParts.length > 0) {
            process.env[key.trim()] = vParts.join('=').trim().replace(/^["']|["']$/g, '');
        }
    });
}

loadEnv();

const pool = new Pool({ connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL, ssl: true });

async function verify() {
    try {
        console.log('--- DIAGNOSTIC: TAG FILTERING ---');

        // 1. Check a few products and their tags
        const allRes = await pool.query("SELECT id, name, visibility_tags FROM products LIMIT 5");
        console.log('Sample Products:');
        allRes.rows.forEach(r => console.log(`- ${r.name}: ${JSON.stringify(r.visibility_tags)}`));

        // 2. Test the specific tag filter
        const tag = 'formal-shirts';
        console.log(`\nTesting filter for tag: "${tag}"`);

        const filteredRes = await pool.query(
            "SELECT name, visibility_tags FROM products WHERE visibility_tags @> jsonb_build_array($1::text) LIMIT 10",
            [tag]
        );

        console.log(`Found ${filteredRes.rows.length} products with tag "${tag}"`);
        filteredRes.rows.forEach(r => console.log(`- ${r.name} (Tags: ${JSON.stringify(r.visibility_tags)})`));

        // 3. Count products with THIS tag vs TOTAL products
        const countTagged = await pool.query("SELECT count(*) FROM products WHERE visibility_tags @> jsonb_build_array($1::text)", [tag]);
        const countTotal = await pool.query("SELECT count(*) FROM products WHERE is_active = true");

        console.log(`\nSummary:`);
        console.log(`Total Active Products: ${countTotal.rows[0].count}`);
        console.log(`Products with "${tag}" tag: ${countTagged.rows[0].count}`);

    } catch (e) {
        console.error('ERROR during diagnostic:', e);
    } finally {
        await pool.end();
    }
}

verify();
