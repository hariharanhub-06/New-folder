const { Client } = require('pg');
const ImageKit = require('imagekit');
const https = require('https');
require('dotenv').config({ path: '.env.local' });

// Setup accounts
const newImageKit = new ImageKit({
    publicKey: process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.SECONDARY_IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_URL_ENDPOINT
});

const dbClient = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const DRY_RUN = process.env.DRY_RUN === 'true';
const PRIMARY_MARKERS = ['lzmpw', 'lzmpwlx08'];
const SECONDARY_URL_ENDPOINT = process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_URL_ENDPOINT;

async function downloadImage(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
            const chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => resolve(Buffer.concat(chunks)));
        }).on('error', reject);
    });
}

function extractCore(filename) {
    // If it has a timestamp-like prefix (e.g. 1766863876273-), skip it
    if (filename.includes('-')) {
        return filename.split('-').slice(1).join('-');
    }
    return filename;
}

async function run() {
    try {
        await dbClient.connect();
        console.log(`🚀 Starting ROBUST ${DRY_RUN ? 'DRY RUN' : 'REAL'} migration...\n`);

        // 1. Map existing files in secondary account
        console.log("📁 Mapping files in secondary account...");
        let secondaryFiles = [];
        let limit = 1000;
        let skip = 0;
        while (true) {
            const batch = await newImageKit.listFiles({ path: '/products', limit, skip });
            secondaryFiles = secondaryFiles.concat(batch);
            if (batch.length < limit) break;
            skip += limit;
        }
        console.log(`Found ${secondaryFiles.length} files in /products.\n`);

        // 2. Fetch products
        const res = await dbClient.query("SELECT id, name, image_url, images FROM products");
        console.log(`Checking ${res.rows.length} products total.\n`);

        let updatedCount = 0;

        for (const product of res.rows) {
            let updatedMainUrl = product.image_url;
            let updatedGallery = [];
            let needsUpdate = false;

            const mapUrl = async (oldUrl, label) => {
                if (!oldUrl) return oldUrl;
                const isPrimary = PRIMARY_MARKERS.some(m => oldUrl.includes(m));
                if (!isPrimary) return oldUrl;

                const filename = oldUrl.split('/').pop().split('?')[0];
                const core = extractCore(filename);

                // Fuzzy match in secondary
                const match = secondaryFiles.find(sf => sf.name.includes(core) || core.includes(sf.name));

                if (match) {
                    // console.log(`  [${label}] Match found: ${match.name}`);
                    return match.url;
                }

                // If no match, try download/upload as last resort
                try {
                    console.log(`  [${label}] ⚠️ No match for ${filename}. Attempting migration...`);
                    if (DRY_RUN) return `${SECONDARY_URL_ENDPOINT}/products/${filename}`;

                    const buffer = await downloadImage(oldUrl.replace('lzmpw/', 'lzmpwlx08/')); // Fix common typo
                    const upload = await newImageKit.upload({
                        file: buffer,
                        fileName: filename,
                        folder: '/products'
                    });
                    console.log(`  [${label}] ✅ Uploaded new copy.`);
                    return upload.url;
                } catch (e) {
                    console.error(`  [${label}] ✗ Failed: ${e.message}`);
                    return oldUrl;
                }
            };

            // Main Image
            updatedMainUrl = await mapUrl(product.image_url, "Main");
            if (updatedMainUrl !== product.image_url) needsUpdate = true;

            // Gallery
            const gallery = product.images || [];
            if (Array.isArray(gallery)) {
                for (let i = 0; i < gallery.length; i++) {
                    const newUrl = await mapUrl(gallery[i], `Gallery[${i}]`);
                    updatedGallery.push(newUrl);
                    if (newUrl !== gallery[i]) needsUpdate = true;
                }
            } else {
                updatedGallery = gallery;
            }

            if (needsUpdate) {
                if (!DRY_RUN) {
                    await dbClient.query(
                        'UPDATE products SET image_url = $1, images = $2::jsonb, updated_at = NOW() WHERE id = $3',
                        [updatedMainUrl, JSON.stringify(updatedGallery), product.id]
                    );
                    console.log(`[Product: ${product.id}] updated.`);
                } else {
                    console.log(`[Product: ${product.id}] would update.`);
                }
                updatedCount++;
            }
        }

        console.log(`\n✨ Done. Updated ${updatedCount} products.`);

    } catch (e) {
        console.error(e);
    } finally {
        await dbClient.end();
    }
}

run();
