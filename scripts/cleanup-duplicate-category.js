// Quick cleanup script to remove the duplicate "OFFER BAGGY SHIRT " (with trailing space)
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function cleanup() {
    const client = await pool.connect();
    try {
        console.log('\n🧹 Cleaning up duplicate category...\n');

        // Delete the one with trailing space (ID: offer-baggy-shirt-)
        const result = await client.query(
            "DELETE FROM categories WHERE id = 'offer-baggy-shirt-'"
        );

        if (result.rowCount > 0) {
            console.log(`✅ Deleted ${result.rowCount} duplicate category`);
        } else {
            console.log('ℹ️  No duplicate found (may have been already deleted)');
        }

        console.log('\n✨ Cleanup complete!\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

cleanup();
