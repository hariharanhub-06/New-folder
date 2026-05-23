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
        console.log('--- TESTING TAG FILTERING ---');
        const tag = 'new-arrivals';

        // Simulating the query logic
        const query = `
            SELECT name, visibility_tags FROM products 
            WHERE is_active = true 
            AND visibility_tags @> jsonb_build_array($1::text)
            LIMIT 10
        `;

        console.log(`Querying for tag: ${tag}`);
        const res = await pool.query(query, [tag]);

        console.log(`Results found: ${res.rows.length}`);
        res.rows.forEach(r => {
            console.log(`- ${r.name} (Tags: ${JSON.stringify(r.visibility_tags)})`);
        });

        if (res.rows.length > 1) {
            console.log('\nWARNING: Multiple products found! This confirms the user\'s issue.');
        } else if (res.rows.length === 0) {
            console.log('\nNo products found. (Expected if only test_again has tags but we use different tag)');
        } else {
            console.log('\nOnly one product found (test_again). Filter is working correctly.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

verify();
