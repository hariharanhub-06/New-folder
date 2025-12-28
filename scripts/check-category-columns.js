const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkColumns() {
    try {
        const result = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='categories'
            ORDER BY ordinal_position
        `);

        console.log('\nCategories table columns:');
        result.rows.forEach(row => console.log(`  - ${row.column_name}`));

        const hasDisplayOrder = result.rows.some(r => r.column_name === 'display_order');
        console.log(`\n❓ Has 'display_order' column: ${hasDisplayOrder ? 'YES ✅' : 'NO ❌'}`);

        if (!hasDisplayOrder) {
            console.log('\n⚠️  BUG FOUND: Query orders by display_order but column does not exist!');
            console.log('   This causes random/inconsistent ordering on page load.\n');
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkColumns();
