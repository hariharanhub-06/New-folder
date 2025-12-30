require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function revertDatabaseUrls() {
    try {
        await client.connect();
        console.log('✅ Connected to database\n');

        // Find products using the secondary account URL
        const result = await client.query(`
            SELECT id, name, image_url
            FROM products
            WHERE image_url LIKE '%6k5vfwl1j%'
        `);

        console.log(`Found ${result.rows.length} products to revert\n`);

        let count = 0;
        for (const row of result.rows) {
            const newUrl = row.image_url.replace('6k5vfwl1j', 'lzmpwlx08');
            console.log(`Reverting ${row.name}:`);
            console.log(`  From: ${row.image_url}`);
            console.log(`  To:   ${newUrl}\n`);

            await client.query(
                'UPDATE products SET image_url = $1 WHERE id = $2',
                [newUrl, row.id]
            );
            count++;
        }

        console.log(`✅ Successfully reverted ${count} product URLs to primary account.`);

    } catch (e) {
        console.error('❌ Error:', e.message);
    } finally {
        await client.end();
    }
}

revertDatabaseUrls();
