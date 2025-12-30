require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function analyzeImageUrls() {
    try {
        await client.connect();

        // Count products by ImageKit account
        const result = await client.query(`
            SELECT 
                CASE 
                    WHEN image_url LIKE '%lzmpw%' THEN 'Old Account (lzmpw) - 429 ERRORS'
                    WHEN image_url LIKE '%6k5vfwl1j%' THEN 'New Account (6k5vfwl1j) - WORKING'
                    ELSE 'Other/External URL'
                END as account_type,
                COUNT(*) as product_count
            FROM products
            WHERE image_url IS NOT NULL
            GROUP BY account_type
            ORDER BY product_count DESC
        `);

        console.log("\n=== IMAGE URL ANALYSIS ===\n");

        let totalOld = 0;
        let totalNew = 0;

        result.rows.forEach(row => {
            console.log(`${row.account_type}: ${row.product_count} products`);
            if (row.account_type.includes('lzmpw')) totalOld = row.product_count;
            if (row.account_type.includes('6k5vfwl1j')) totalNew = row.product_count;
        });

        console.log(`\n⚠️  AFFECTED: ${totalOld} products showing 429 errors`);
        console.log(`✅ WORKING: ${totalNew} products with new account`);

        // Show sample products with old URLs
        const samples = await client.query(`
            SELECT name, image_url
            FROM products
            WHERE image_url LIKE '%lzmpw%'
            LIMIT 5
        `);

        if (samples.rows.length > 0) {
            console.log(`\n📋 Sample affected products:`);
            samples.rows.forEach(p => {
                console.log(`  - ${p.name}`);
            });
        }

    } catch (e) {
        console.error("Error:", e.message);
    } finally {
        await client.end();
    }
}

analyzeImageUrls();
