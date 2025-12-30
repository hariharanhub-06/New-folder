require('dotenv').config({ path: '.env.local' });
const ImageKit = require('imagekit');
const { Client } = require('pg');
const https = require('https');

const oldImageKit = new ImageKit({
    publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT
});

const newImageKit = new ImageKit({
    publicKey: process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.SECONDARY_IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_URL_ENDPOINT
});

const dbClient = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function downloadImage(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`HTTP ${res.statusCode}`));
                return;
            }
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks)));
        }).on('error', reject);
    });
}

async function completeMigration() {
    try {
        await dbClient.connect();
        console.log('✅ Connected\n');

        // Get ALL products
        const result = await dbClient.query(`
            SELECT id, name, image_url
            FROM products
            WHERE image_url IS NOT NULL
            ORDER BY id
        `);

        console.log(`🔧 Migrating ${result.rows.length} products\n`);

        let success = 0;
        let failed = 0;

        for (const product of result.rows) {
            try {
                console.log(`${product.id}. ${product.name}`);

                // Download from old account
                let oldUrl = product.image_url;
                if (oldUrl.includes('6k5vfwl1j')) {
                    oldUrl = oldUrl.replace('6k5vfwl1j', 'lzmpwlx08');
                }

                const imageBuffer = await downloadImage(oldUrl);
                console.log(`  ✓ Downloaded ${(imageBuffer.length / 1024).toFixed(1)}KB`);

                // Upload to new account
                const filename = `product-${product.id}-${Date.now()}.jpg`;
                const uploadResult = await newImageKit.upload({
                    file: imageBuffer,
                    fileName: filename,
                    folder: '/products'
                });

                console.log(`  ✓ Uploaded: ${uploadResult.url.substring(0, 60)}...`);

                // Update database
                await dbClient.query(
                    'UPDATE products SET image_url = $1 WHERE id = $2',
                    [uploadResult.url, product.id]
                );

                console.log(`  ✓ Updated\n`);
                success++;

            } catch (error) {
                console.error(`  ✗ ${error.message}\n`);
                failed++;
            }

            await new Promise(r => setTimeout(r, 300));
        }

        console.log(`\n✅ Success: ${success}`);
        console.log(`❌ Failed: ${failed}`);

    } catch (error) {
        console.error('Fatal:', error.message);
    } finally {
        await dbClient.end();
    }
}

console.log('🚀 COMPLETE MIGRATION\n');
completeMigration();
