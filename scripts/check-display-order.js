const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkDisplayOrder() {
    try {
        const result = await pool.query(`
            SELECT name, display_order, created_at
            FROM categories
            ORDER BY created_at
        `);

        console.log('\n📋 Category Display Order Status:\n');
        result.rows.forEach((cat, index) => {
            const order = cat.display_order !== null ? cat.display_order : 'NULL ❌';
            console.log(`${index + 1}. ${cat.name.padEnd(30)} Order: ${order}`);
        });

        const nullCount = result.rows.filter(r => r.display_order === null).length;

        console.log(`\n❓ Categories with NULL display_order: ${nullCount}/${result.rows.length}`);

        if (nullCount > 0) {
            console.log('\n🐛 BUG FOUND: NULL display_order causes random/inconsistent sorting!');
            console.log('   PostgreSQL treats NULL values inconsistently in ORDER BY.');
            console.log('\n💡 FIX: Set display_order for all categories\n');
        } else {
            console.log('\n✅ All categories have display_order set\n');
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkDisplayOrder();
