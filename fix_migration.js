require('dotenv').config({ path: '.env.local' });
const ImageKit = require('imagekit');
const { Client } = require('pg');
const https = require('https');

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
        // Remove any transformation parameters for downloading original
        const cleanUrl = url.split('/tr:')[0] + '/' + url.split('/').pop();

        console.log(`    Downloading from: ${cleanUrl}`);
        https.get(cleanUrl, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`HTTP ${res.statusCode}`));
                return;
            }
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks)));
            res.on('error', reject);
        }).on('error', reject);
    });
}

async function reRunMigration() {
    try {
        await dbClient.connect();
        console.log('✅ Connected to database\n');

        // Get all products with NEW account URLs that actually return 404
        const result = await dbClient.query(`
            SELECT id, name, image_url
            FROM products
            WHERE image_url LIKE '%6k5vfwl1j%'
            ORDER BY created_at DESC
        `);

        console.log(`Found ${result.rows.length} products with NEW account URLs\n`);
        console.log('🔧 FIXING: Re-migrating from OLD account to NEW account\n');
        console.log('='.repeat(70) + '\n');

        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;

        for (const product of result.rows) {
            try {
                console.log(`Processing: ${product.name}`);

                // Get the filename from the new URL
                const filename = product.image_url.split('/').pop();

                // Try to find this product in OLD ImageKit account first
                // We need to construct the old URL or download from old account
                const oldUrl = product.image_url.replace('6k5vfwl1j', 'lzmpwlx08');

                console.log(`    Trying old URL: ${oldUrl}`);

                let imageBuffer;
                try {
                    imageBuffer = await downloadImage(oldUrl);
                    console.log(`    ✓ Downloaded (${(imageBuffer.length / 1024).toFixed(1)}KB)`);
                } catch (downloadError) {
                    console.log(`    ✗ Download failed: ${downloadError.message}`);
                    console.log(`    Skipping - cannot recover this image\n`);
                    skippedCount++;
                    continue;
                }

                // Upload to new account
                const uploadResult = await newImageKit.upload({
                    file: imageBuffer,
                    fileName: filename,
                    folder: '/products'
                });

                console.log(`    ✓ Uploaded to new account`);

                // Verify the upload
                const newUrl = uploadResult.url;
                console.log(`    ✓ New URL: ${newUrl}\n`);

                //Update database ONLY if different
                if (newUrl !== product.image_url) {
                    await dbClient.query(
                        'UPDATE products SET image_url = $1 WHERE id = $2',
                        [newUrl, product.id]
                    );
                    console.log(`    ✓ Database updated\n`);
                }

                successCount++;

            } catch (error) {
                console.error(`    ✗ Error: ${error.message}\n`);
                errorCount++;
            }

            // Rate limit
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log('\n' + '='.repeat(70));
        console.log(`Migration Complete!`);
        console.log(`✅ Success: ${successCount} products`);
        console.log(`⏭️  Skipped: ${skippedCount} products (old image not found)`);
        console.log(`❌ Failed: ${errorCount} products`);
        console.log('='.repeat(70));

    } catch (error) {
        console.error('Fatal error:', error);
    } finally {
        await dbClient.end();
    }
}

console.log('🔧 RE-RUNNING IMAGEKIT MIGRATION (Fix broken uploads)...\n');
reRunMigration();
