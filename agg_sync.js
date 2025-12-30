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

async function aggressiveSync() {
    try {
        await client.connect();
        console.log('🔄 STARTING AGGRESSIVE SYNC\n');

        const files = await ik.listFiles({ limit: 1000 });
        console.log(`✅ Loaded ${files.length} files from IK`);

        const products = await client.query('SELECT id, name, image_url FROM products');
        console.log(`📦 Loaded ${products.rows.length} products from DB\n`);

        let fixed = 0;
        let notFound = 0;

        for (const p of products.rows) {
            const dbUrl = p.image_url || '';
            const dbFilename = dbUrl.split('/').pop().split('?')[0];

            // The timestamp part is usually the first 13 characters
            const prefix = dbFilename.substring(0, 13);

            if (prefix.length < 5) {
                console.log(`⚠️ Skipping ${p.name} - URL looks invalid: ${dbUrl}`);
                continue;
            }

            const match = files.find(f => f.name.startsWith(prefix));

            if (match) {
                if (dbUrl !== match.url) {
                    console.log(`✅ MATCH: ${p.name}`);
                    console.log(`   Old: ${dbUrl}`);
                    console.log(`   New: ${match.url}\n`);
                    await client.query('UPDATE products SET image_url = $1 WHERE id = $2', [match.url, p.id]);
                    fixed++;
                }
            } else {
                console.log(`❌ NOT FOUND: ${p.name} (Prefix: ${prefix})`);
                notFound++;
            }
        }

        console.log(`\n🎉 DONE! Fixed: ${fixed}, Not Found: ${notFound}`);

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

aggressiveSync();
