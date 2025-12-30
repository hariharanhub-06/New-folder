require('dotenv').config({ path: '.env.local' });
const ImageKit = require('imagekit');
const { Client } = require('pg');

const ik = new ImageKit({
    publicKey: process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.SECONDARY_IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_URL_ENDPOINT
});

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function fuzzySync() {
    try {
        await client.connect();
        console.log('🔄 STARTING FUZZY SYNC\n');

        // 1. Get all files from IK
        const files = await ik.listFiles({ limit: 1000 });
        console.log(`✅ Loaded ${files.length} files from IK\n`);

        // 2. Get all products from DB
        const products = await client.query('SELECT id, name, image_url FROM products WHERE image_url IS NOT NULL');
        console.log(`📦 Loaded ${products.rows.length} products from DB\n`);

        let fixedCount = 0;

        for (const p of products.rows) {
            // Extract the "root" of the filename (first 15 chars should be the timestamp part)
            const dbFullFilename = p.image_url.split('/').pop().split('?')[0];
            const rootPrefix = dbFullFilename.substring(0, 15);

            // Look for a match in IK files
            const match = files.find(f => f.name.startsWith(rootPrefix));

            if (match) {
                if (p.image_url !== match.url) {
                    console.log(`✅ FIXING: ${p.name}`);
                    console.log(`   From: ${p.image_url}`);
                    console.log(`   To:   ${match.url}\n`);
                    await client.query('UPDATE products SET image_url = $1 WHERE id = $2', [match.url, p.id]);
                    fixedCount++;
                }
            } else {
                console.log(`❌ NO MATCH: ${p.name} (Prefix: ${rootPrefix})`);
            }
        }

        console.log(`\n🎉 FINISHED! Fixed ${fixedCount} products.`);

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

fuzzySync();
