require('dotenv').config({ path: '.env.local' });
const ImageKit = require('imagekit');
const { Client } = require('pg');

const secondaryIK = new ImageKit({
    publicKey: process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.SECONDARY_IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_URL_ENDPOINT
});

const primaryIK = new ImageKit({
    publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT
});

const dbClient = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function analyzeRestoration() {
    try {
        await dbClient.connect();
        console.log('✅ Connected to database');

        // 1. Get all files in secondary
        console.log('🔍 Listing files in secondary account...');
        const secondaryFiles = await secondaryIK.listFiles({ path: '/products', limit: 500 });
        const secondaryMap = new Map();
        secondaryFiles.forEach(f => secondaryMap.set(f.name, f.url));
        console.log(`✅ Secondary account has ${secondaryFiles.length} files.`);

        // 2. Get all products from DB
        const products = await dbClient.query('SELECT id, name, image_url FROM products WHERE image_url IS NOT NULL');
        console.log(`📦 Found ${products.rows.length} products in database.`);

        const missing = [];
        const found = [];

        for (const p of products.rows) {
            const filename = p.image_url.split('/').pop().split('?')[0];
            if (secondaryMap.has(filename)) {
                found.push({ id: p.id, name: p.name, newUrl: secondaryMap.get(filename) });
            } else {
                missing.push({ id: p.id, name: p.name, oldUrl: p.image_url });
            }
        }

        console.log(`\n📊 Status:`);
        console.log(`  - READY in secondary: ${found.length} products`);
        console.log(`  - MISSING from secondary: ${missing.length} products`);

        if (found.length > 0) {
            console.log('\n🚀 Step 1: Updating database to use the ' + found.length + ' images already in secondary.');
            for (const item of found) {
                await dbClient.query('UPDATE products SET image_url = $1 WHERE id = $2', [item.newUrl, item.id]);
            }
            console.log('✅ Updated database for existing images.');
        }

        if (missing.length > 0) {
            console.log('\n🚨 The following ' + missing.length + ' products ARE NOT in secondary:');
            missing.slice(0, 10).forEach(m => console.log(`  - ${m.name}`));
            if (missing.length > 10) console.log(`  - ... and ${missing.length - 10} more.`);
        }

    } catch (e) {
        console.error('❌ Error:', e.message);
    } finally {
        await dbClient.end();
    }
}

analyzeRestoration();
