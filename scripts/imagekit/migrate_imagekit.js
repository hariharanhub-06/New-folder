require('dotenv').config({ path: '.env.local' });
const ImageKit = require('imagekit');
const { Client } = require('pg');
const https = require('https');
const fs = require('fs');

// Initialize both ImageKit accounts
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
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks)));
            res.on('error', reject);
        }).on('error', reject);
    });
}

async function migrateImages() {
    try {
        await dbClient.connect();
        console.log('✅ Connected to database\n');

        // Get all products with old ImageKit URLs
        const result = await dbClient.query(`
            SELECT id, name, image_url
            FROM products
            WHERE image_url LIKE '%lzmpw%'
            ORDER BY created_at DESC
        `);

        console.log(`Found ${result.rows.length} products to migrate\n`);

        let successCount = 0;
        let errorCount = 0;

        for (const product of result.rows) {
            try {
                console.log(`Migrating: ${product.name}`);

                // Extract filename from old URL
                const urlParts = product.image_url.split('/');
                const filename = urlParts[urlParts.length - 1];

                // Try to download image (using direct URL - might work even with bandwidth limit)
                let imageBuffer;
                try {
                    imageBuffer = await downloadImage(product.image_url);
                    console.log(`  ✓ Downloaded (${(imageBuffer.length / 1024).toFixed(1)}KB)`);
                } catch (downloadError) {
                    console.log(`  ✗ Download failed (429 error or network issue)`);
                    errorCount++;
                    continue;
                }

                // Upload to new account
                const uploadResult = await newImageKit.upload({
                    file: imageBuffer,
                    fileName: filename,
                    folder: '/products'
                });

                console.log(`  ✓ Uploaded to new account`);

                // Update database with new URL
                await dbClient.query(
                    'UPDATE products SET image_url = $1 WHERE id = $2',
                    [uploadResult.url, product.id]
                );

                console.log(`  ✓ Database updated\n`);
                successCount++;

            } catch (error) {
                console.error(`  ✗ Error: ${error.message}\n`);
                errorCount++;
            }

            // Rate limit to avoid overwhelming APIs
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log('\n' + '='.repeat(60));
        console.log(`Migration Complete!`);
        console.log(`✅ Success: ${successCount} products`);
        console.log(`❌ Failed: ${errorCount} products`);
        console.log('='.repeat(60));

    } catch (error) {
        console.error('Fatal error:', error);
    } finally {
        await dbClient.end();
    }
}

// Run migration
console.log('🚀 Starting ImageKit Migration...\n');
migrateImages();
