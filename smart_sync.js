require('dotenv').config({ path: '.env.local' });
const ImageKit = require('imagekit');
const { Client } = require('pg');

const newImageKit = new ImageKit({
    publicKey: process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.SECONDARY_IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_URL_ENDPOINT
});

const dbClient = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function smartSync() {
    try {
        await dbClient.connect();
        console.log('🔧 SMART SYNC: Using available images\n');

        // Get files actually in NEW account
        const newFiles = await newImageKit.listFiles({ path: '/products', limit: 500 });
        console.log(`✅ Found ${newFiles.length} files in NEW account\n`);

        const fileMap = new Map();
        newFiles.forEach(f => fileMap.set(f.name, f.url));

        // Get all products
        const products = await dbClient.query('SELECT id, name, image_url FROM products WHERE image_url IS NOT NULL');

        let updated = 0;
        let reverted = 0;

        for (const p of products.rows) {
            const filename = p.image_url.split('/').pop().split('?')[0];

            if (fileMap.has(filename)) {
                // File exists in NEW account - use it
                const newUrl = fileMap.get(filename);
                if (p.image_url !== newUrl) {
                    await dbClient.query('UPDATE products SET image_url = $1 WHERE id = $2', [newUrl, p.id]);
                    console.log(`✅ ${p.name} -> NEW account`);
                    updated++;
                }
            } else {
                // File NOT in new account - revert to OLD account URL
                if (!p.image_url.includes('lzmpwlx08')) {
                    const oldUrl = p.image_url.replace('6k5vfwl1j', 'lzmpwlx08').split('?')[0];
                    await dbClient.query('UPDATE products SET image_url = $1 WHERE id = $2', [oldUrl, p.id]);
                    console.log(`⏪ ${p.name} -> OLD account (not migrated yet)`);
                    reverted++;
                }
            }
        }

        console.log(`\n✅ Updated to NEW: ${updated}`);
        console.log(`⏪ Reverted to OLD: ${reverted}`);
        console.log(`\n💡 Images will work when old account bandwidth resets`);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await dbClient.end();
    }
}

smartSync();
