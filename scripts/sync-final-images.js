const { Client } = require('pg');
const ImageKit = require('imagekit');
require('dotenv').config({ path: '.env.local' });

// Setup Secondary ImageKit
const imagekit = new ImageKit({
    publicKey: process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.SECONDARY_IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_URL_ENDPOINT
});

const dbClient = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const DRY_RUN = process.env.DRY_RUN !== 'false'; // Default to true for safety

function extractCore(filename) {
    if (filename.includes('-')) {
        // Remove timestamp prefix if it's there (e.g. 1766863876273-blob_abc -> blob_abc)
        const parts = filename.split('-');
        if (parts[0].length >= 10 && !isNaN(parts[0])) {
            return parts.slice(1).join('-');
        }
    }
    return filename;
}

async function run() {
    try {
        await dbClient.connect();
        console.log(`🚀 Starting FINAL Image Sync (${DRY_RUN ? 'DRY RUN' : 'REAL'})\n`);

        // 1. Get all files from Secondary ImageKit
        console.log("📁 Fetching files from Secondary ImageKit...");
        let allFiles = [];
        let skip = 0;
        let limit = 1000;
        while (true) {
            const files = await imagekit.listFiles({
                path: '/products',
                limit,
                skip
            });
            allFiles = allFiles.concat(files);
            if (files.length < limit) break;
            skip += limit;
        }
        console.log(`Found ${allFiles.length} files in /products.\n`);

        // 2. Fetch products
        const res = await dbClient.query("SELECT id, name, image_url, images FROM products");
        console.log(`Processing ${res.rows.length} products...\n`);

        for (const product of res.rows) {
            let needsUpdate = false;
            let newMainUrl = product.image_url;
            let newGallery = [];

            const findInIK = (oldUrl) => {
                if (!oldUrl) return null;
                const filename = oldUrl.split('/').pop().split('?')[0];
                const core = extractCore(filename);

                // Fuzzy match: prioritizes exact match, then core match
                const match = allFiles.find(f => f.name === filename) ||
                    allFiles.find(f => f.name.includes(core) || core.includes(f.name));

                return match ? match.url : null;
            };

            // Sync Main Image
            const matchedMain = findInIK(product.image_url);
            if (matchedMain && matchedMain !== product.image_url) {
                newMainUrl = matchedMain;
                needsUpdate = true;
            }

            // Sync Gallery
            const gallery = Array.isArray(product.images) ? product.images :
                (typeof product.images === 'string' ? JSON.parse(product.images) : []);

            for (const imgUrl of gallery) {
                const matched = findInIK(imgUrl);
                if (matched && matched !== imgUrl) {
                    newGallery.push(matched);
                    needsUpdate = true;
                } else {
                    newGallery.push(imgUrl);
                }
            }

            if (needsUpdate) {
                console.log(`Updating [${product.name}]:`);
                if (newMainUrl !== product.image_url) console.log(`  Main: ${newMainUrl}`);

                if (!DRY_RUN) {
                    await dbClient.query(
                        'UPDATE products SET image_url = $1, images = $2::jsonb, updated_at = NOW() WHERE id = $3',
                        [newMainUrl, JSON.stringify(newGallery), product.id]
                    );
                    console.log(`  ✅ Updated in DB.\n`);
                } else {
                    console.log(`  [Dry Run] Would update DB.\n`);
                }
            }
        }

        console.log("\n✨ Done! If this was a dry run, set DRY_RUN=false to apply changes.");

    } catch (e) {
        console.error("Fatal error:", e);
    } finally {
        await dbClient.end();
    }
}

run();
