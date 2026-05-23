require('dotenv').config({ path: '.env.local' });
const ImageKit = require('imagekit');
const { Client } = require('pg');

// NEW ImageKit account
const newImageKit = new ImageKit({
    publicKey: process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.SECONDARY_IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_URL_ENDPOINT
});

// OLD ImageKit account  
const oldImageKit = new ImageKit({
    publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT
});

const dbClient = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function syncActualUrls() {
    try {
        await dbClient.connect();
        console.log('✅ Connected to database\n');

        // Get all files from NEW ImageKit account
        console.log('📁 Fetching files from NEW ImageKit account (6k5vfwl1j)...\n');
        const newFiles = await newImageKit.listFiles({
            path: '/products',
            limit: 500
        });

        console.log(`Found ${newFiles.length} files in NEW account\n`);

        // Create a map of filename -> actual URL
        const fileMap = new Map();
        newFiles.forEach(file => {
            const filename = file.name;
            fileMap.set(filename, file.url);
        });

        // Get all products from database
        const products = await dbClient.query(`
            SELECT id, name, image_url
            FROM products
            WHERE image_url IS NOT NULL
            ORDER BY name
        `);

        console.log(`Found ${products.rows.length} products in database\n`);
        console.log('🔧 Checking and fixing URLs...\n');
        console.log('='.repeat(70) + '\n');

        let fixedCount = 0;
        let unchangedCount = 0;
        let notFoundCount = 0;

        for (const product of products.rows) {
            // Extract filename from current URL
            const urlParts = product.image_url.split('/');
            const currentFilename = urlParts[urlParts.length - 1].split('?')[0]; // Remove query params if any

            // Check if this file exists in new account
            if (fileMap.has(currentFilename)) {
                const correctUrl = fileMap.get(currentFilename);

                if (product.image_url !== correctUrl) {
                    console.log(`Fixing: ${product.name}`);
                    console.log(`  Old: ${product.image_url}`);
                    console.log(`  New: ${correctUrl}\n`);

                    await dbClient.query(
                        'UPDATE products SET image_url = $1 WHERE id = $2',
                        [correctUrl, product.id]
                    );
                    fixedCount++;
                } else {
                    unchangedCount++;
                }
            } else {
                console.log(`⚠️  NOT FOUND in new account: ${product.name}`);
                console.log(`   Filename: ${currentFilename}`);
                console.log(`   Current URL: ${product.image_url}\n`);
                notFoundCount++;
            }
        }

        console.log('\n' + '='.repeat(70));
        console.log(`\n📊 Summary:`);
        console.log(`  ✅ Fixed: ${fixedCount} products`);
        console.log(`  ⏭️  Unchanged: ${unchangedCount} products`);
        console.log(`  ⚠️  Not found in new account: ${notFoundCount} products`);
        console.log('='.repeat(70) + '\n');

        if (notFoundCount > 0) {
            console.log('⚠️  Some products still need migration from old account\n');
        }

    } catch (error) {
        console.error('❌ Fatal error:', error);
    } finally {
        await dbClient.end();
    }
}

console.log('🔄 SYNCING DATABASE URLS WITH ACTUAL IMAGEKIT FILES...\n');
syncActualUrls();
