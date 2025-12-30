require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function verifyMigration() {
    try {
        await client.connect();
        console.log('\n🔍 MIGRATION VERIFICATION REPORT\n');
        console.log('='.repeat(60));

        // Count products by ImageKit account
        const result = await client.query(`
            SELECT 
                CASE 
                    WHEN image_url LIKE '%lzmpw%' THEN 'Old Account (lzmpwlx08)'
                    WHEN image_url LIKE '%6k5vfwl1j%' THEN 'New Account (6k5vfwl1j)'
                    ELSE 'Other/External'
                END as account_type,
                COUNT(*) as product_count
            FROM products
            WHERE image_url IS NOT NULL
            GROUP BY account_type
            ORDER BY product_count DESC
        `);

        let totalOld = 0;
        let totalNew = 0;
        let totalOther = 0;

        console.log('\n📊 Products by ImageKit Account:\n');
        result.rows.forEach(row => {
            const emoji = row.account_type.includes('6k5vfwl1j') ? '✅' :
                row.account_type.includes('lzmpw') ? '⚠️ ' : 'ℹ️ ';
            console.log(`${emoji} ${row.account_type}: ${row.product_count} products`);

            if (row.account_type.includes('lzmpw')) totalOld = row.product_count;
            if (row.account_type.includes('6k5vfwl1j')) totalNew = row.product_count;
            if (row.account_type.includes('Other')) totalOther = row.product_count;
        });

        console.log('\n' + '='.repeat(60));

        if (totalOld === 0 && totalNew > 0) {
            console.log('\n🎉 SUCCESS! All products migrated to new account!');
            console.log(`   ✅ ${totalNew} products now using NEW account (6k5vfwl1j)`);
            console.log(`   ❌ ${totalOld} products still on OLD account (lzmpwlx08)`);
        } else if (totalOld > 0) {
            console.log(`\n⚠️  PARTIAL MIGRATION: ${totalOld} products still on old account`);
            console.log(`   ✅ ${totalNew} products migrated to NEW account`);
            console.log(`   ❌ ${totalOld} products still on OLD account`);
        } else {
            console.log(`\n✅ Migration Status: ${totalNew} products on new account`);
        }

        if (totalOther > 0) {
            console.log(`   ℹ️  ${totalOther} products using external URLs`);
        }

        console.log('\n' + '='.repeat(60) + '\n');

        // Get total count
        const totalResult = await client.query('SELECT COUNT(*) as total FROM products WHERE image_url IS NOT NULL');
        console.log(`📦 Total products with images: ${totalResult.rows[0].total}\n`);

    } catch (e) {
        console.error("❌ Error:", e.message);
    } finally {
        await client.end();
    }
}

verifyMigration();
