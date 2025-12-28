const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function compareCategories() {
    try {
        const catRes = await pool.query('SELECT id, name FROM categories ORDER BY name');
        const prodRes = await pool.query('SELECT DISTINCT category FROM products ORDER BY category');

        console.log('\n--- CATEGORIES TABLE ---');
        catRes.rows.forEach(r => console.log(`- ${r.name} (${r.id})`));

        console.log('\n--- PRODUCTS CATEGORY COLUMN ---');
        prodRes.rows.forEach(r => console.log(`- ${r.category}`));

        console.log('\n--- MISMATCH ANALYSIS ---');
        const catNames = catRes.rows.map(r => r.name.toLowerCase().trim());
        const prodNames = prodRes.rows.map(r => r.category ? r.category.toLowerCase().trim() : '');

        prodNames.forEach(pn => {
            if (pn && !catNames.includes(pn)) {
                console.log(`⚠️ Product category "${pn}" has NO exact match in categories table.`);
            }
        });

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

compareCategories();
