require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const https = require('https');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

function testImageUrl(url) {
    return new Promise((resolve) => {
        if (!url) {
            resolve({ url, status: 'NULL/EMPTY', accessible: false });
            return;
        }

        https.get(url, (res) => {
            resolve({
                url,
                status: res.statusCode,
                accessible: res.statusCode === 200,
                error: res.statusCode !== 200 ? `HTTP ${res.statusCode}` : null
            });
        }).on('error', (err) => {
            resolve({ url, status: 'ERROR', accessible: false, error: err.message });
        });
    });
}

async function diagnoseImages() {
    try {
        await client.connect();
        console.log('\n🔍 DIAGNOSING IMAGE LOADING ISSUES\n');
        console.log('='.repeat(80));

        // Test a few recent product images
        const result = await client.query(`
            SELECT id, name, image_url
            FROM products
            WHERE category = 'Bottoms'
            ORDER BY created_at DESC
            LIMIT 5
        `);

        console.log('\n📸 Testing "Bottoms" Product Images:\n');

        for (const row of result.rows) {
            console.log(`\n${row.name}`);
            console.log(`  Database URL: ${row.image_url || 'NULL'}`);

            if (!row.image_url) {
                console.log(`  ❌ PROBLEM: No image URL in database!`);
                continue;
            }

            // Test direct access
            const directTest = await testImageUrl(row.image_url);
            console.log(`  Direct Access: ${directTest.accessible ? '✅ OK' : '❌ FAILED'} (${directTest.status})`);

            if (!directTest.accessible) {
                console.log(`  Error: ${directTest.error}`);
            }

            // Test with transformation (simulating optimizeImageUrl)
            if (row.image_url.includes('imagekit.io')) {
                const parts = row.image_url.split('/');
                const filename = parts.pop();
                const transformedUrl = `${parts.join('/')}/tr:w-400,q-75,f-webp/${filename}`;

                console.log(`  Transformed URL: ${transformedUrl}`);
                const transformedTest = await testImageUrl(transformedUrl);
                console.log(`  Transformed Access: ${transformedTest.accessible ? '✅ OK' : '❌ FAILED'} (${transformedTest.status})`);

                if (!transformedTest.accessible) {
                    console.log(`  Error: ${transformedTest.error}`);
                }
            }
        }

        console.log('\n' + '='.repeat(80));

        // Check environment variables
        console.log('\n🔑 Environment Variables Check:\n');
        console.log(`  Primary Endpoint: ${process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_URL_ENDPOINT || 'NOT SET'}`);
        console.log(`  Primary Public Key: ${process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_PUBLIC_KEY ? 'SET' : 'NOT SET'}`);
        console.log(`  Legacy Endpoint: ${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || 'NOT SET'}`);

        console.log('\n' + '='.repeat(80) + '\n');

    } catch (e) {
        console.error("❌ Error:", e.message);
    } finally {
        await client.end();
    }
}

diagnoseImages();
