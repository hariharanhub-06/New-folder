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

async function getPaginatedProducts(filters) {
    const {
        tag,
        isOffer,
        isTrending,
        isNewArrival,
        includeInactive = false
    } = filters;

    const params = [];
    let query = 'SELECT name, visibility_tags FROM products WHERE 1=1';

    if (!includeInactive) {
        query += ' AND is_active = true';
    }

    if (isOffer !== undefined) {
        params.push(isOffer);
        query += ` AND is_offer = $${params.length}`;
    }

    if (isTrending !== undefined) {
        params.push(isTrending);
        query += ` AND is_trending = $${params.length}`;
    }

    if (isNewArrival !== undefined) {
        params.push(isNewArrival);
        query += ` AND is_new_arrival = $${params.length}`;
    }

    const isFiltered = tag || isOffer || isTrending || isNewArrival;

    if (tag) {
        params.push(tag);
        query += ` AND visibility_tags @> jsonb_build_array($${params.length}::text)`;
    } else if (!includeInactive && !isFiltered) {
        query += ` AND (visibility_tags IS NULL OR visibility_tags = '[]'::jsonb)`;
    }

    console.log('SQL:', query);
    console.log('PARAMS:', params);

    const res = await pool.query(query, params);
    return res.rows;
}

async function run() {
    try {
        console.log('--- TEST 1: Requesting "formal-shirts" ---');
        const res1 = await getPaginatedProducts({ tag: 'formal-shirts' });
        console.log(`Results: ${res1.length}`);
        res1.forEach(r => console.log(`- ${r.name}`));

        console.log('\n--- TEST 2: Requesting Home Page Trending (isTrending=true) ---');
        const res2 = await getPaginatedProducts({ isTrending: true });
        console.log(`Results: ${res2.length}`);

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

run();
