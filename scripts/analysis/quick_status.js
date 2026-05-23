require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkMigrationStatus() {
    try {
        await client.connect();

        console.log('\n📊 MIGRATION STATUS REPORT\n');
        console.log('='.repeat(70));

        // Check URLs by account
        const accountResult = await client.query(`
            SELECT 
                CASE 
                    WHEN image_url LIKE '%lzmpwlx08%' OR image_url LIKE '%lzmpw%' THEN 'OLD (lzmppwlx08)'
                    WHEN image_url LIKE '%6k5vfwl1j%' THEN 'NEW (6k5vfwl1j)'
                    ELSE 'OTHER'
                END as account,
                COUNT(*) as count
            FROM products
            WHERE image_url IS NOT NULL
            GROUP BY account
        `);

        console.log('\n📸 Products by ImageKit Account:\n');
        accountResult.rows.forEach(row => {
            const emoji = row.account.includes('NEW') ? '✅' : row.account.includes('OLD') ? '⚠️ ' : 'ℹ️ ';
            console.log(`${emoji} ${row.account}: ${row.count} products`);
        });

        // Get sample products still on OLD account
        const oldProducts = await client.query(`
            SELECT id, name, image_url
            FROM products
            WHERE image_url LIKE '%lzmpw%'
            ORDER BY created_at DESC
            LIMIT 5
        `);

        if (oldProducts.rows.length > 0) {
            console.log('\n🔴 Sample products STILL on old account:\n');
            oldProducts.rows.forEach((p, idx) => {
                console.log(`${idx + 1}. ${p.name}`);
                console.log(`   ${p.image_url}\n`);
            });
        }

        // Get sample products on NEW account
        const newProducts = await client.query(`
            SELECT id, name, image_url
            FROM products
            WHERE image_url LIKE '%6k5vfwl1j%'
            ORDER BY created_at DESC
            LIMIT 5
        `);

        if (newProducts.rows.length > 0) {
            console.log('\n✅ Sample products on NEW account:\n');
            newProducts.rows.forEach((p, idx) => {
                console.log(`${idx + 1}. ${p.name}`);
                console.log(`   ${p.image_url}\n`);
            });
        }

        console.log('='.repeat(70) + '\n');

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await client.end();
    }
}

checkMigrationStatus();
