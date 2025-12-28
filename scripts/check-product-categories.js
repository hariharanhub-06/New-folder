const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkCategoryNames() {
    try {
        // Check product categories
        const products = await pool.query(`
            SELECT DISTINCT category 
            FROM products 
            WHERE is_active = true
            ORDER BY category
        `);

        console.log('\n📦 Product Categories in DB:');
        products.rows.forEach((row, i) => {
            console.log(`   ${i + 1}. "${row.category}"`);
        });

        // Check categories table
        const categories = await pool.query(`
            SELECT name 
            FROM categories 
            WHERE is_active = true
            ORDER BY name
        `);

        console.log('\n📁 Category Table Names:');
        categories.rows.forEach((row, i) => {
            console.log(`   ${i + 1}. "${row.name}"`);
        });

        // Test case sensitivity
        console.log('\n🔍 Testing "Shoes" vs "shoes":');
        const test1 = await pool.query(`SELECT COUNT(*) FROM products WHERE category = 'Shoes'`);
        const test2 = await pool.query(`SELECT COUNT(*) FROM products WHERE category = 'shoes'`);
        const test3 = await pool.query(`SELECT COUNT(*) FROM products WHERE LOWER(category) = LOWER('Shoes')`);

        console.log(`   Exact "Shoes": ${test1.rows[0].count} products`);
        console.log(`   Exact "shoes": ${test2.rows[0].count} products`);
        console.log(`   Case-insensitive: ${test3.rows[0].count} products`);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkCategoryNames();
