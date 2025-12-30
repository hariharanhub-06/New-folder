require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkImageUrls() {
    try {
        await client.connect();
        console.log('\n🔍 CHECKING IMAGE URLS\n');
        console.log('='.repeat(70));

        // Get sample products with their image URLs
        const result = await client.query(`
            SELECT id, name, image_url
            FROM products
            ORDER BY created_at DESC
            LIMIT 10
        `);

        console.log('\n📸 Sample Product Image URLs:\n');
        result.rows.forEach((row, idx) => {
            console.log(`${idx + 1}. ${row.name}`);
            console.log(`   URL: ${row.image_url}`);

            if (row.image_url.includes('6k5vfwl1j')) {
                console.log('   ✅ NEW account (6k5vfwl1j)');
            } else if (row.image_url.includes('lzmpw')) {
                console.log('   ⚠️  OLD account (lzmpwlx08) - STILL NEEDS MIGRATION');
            } else {
                console.log('   ℹ️  External/Other URL');
            }
            console.log('');
        });

        // Check for any null or empty image URLs
        const nullCheck = await client.query(`
            SELECT COUNT(*) as count
            FROM products
            WHERE image_url IS NULL OR image_url = ''
        `);

        if (nullCheck.rows[0].count > 0) {
            console.log(`⚠️  WARNING: ${nullCheck.rows[0].count} products have NULL or empty image URLs!\n`);
        }

        // Check URL format issues
        const formatCheck = await client.query(`
            SELECT id, name, image_url
            FROM products
            WHERE image_url NOT LIKE '%imagekit.io%'
            AND image_url IS NOT NULL
            AND image_url != ''
            LIMIT 5
        `);

        if (formatCheck.rows.length > 0) {
            console.log('ℹ️  Products with non-ImageKit URLs:\n');
            formatCheck.rows.forEach(row => {
                console.log(`   - ${row.name}: ${row.image_url}`);
            });
            console.log('');
        }

        console.log('='.repeat(70) + '\n');

    } catch (e) {
        console.error("❌ Error:", e.message);
    } finally {
        await client.end();
    }
}

checkImageUrls();
