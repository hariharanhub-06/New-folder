const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function compareCategories() {
    try {
        const catRes = await pool.query('SELECT name FROM categories WHERE is_active = true');
        const prodRes = await pool.query('SELECT DISTINCT category FROM products WHERE is_active = true');

        const catNames = catRes.rows.map(r => r.name);
        const prodCategories = prodRes.rows.map(r => r.category);

        console.log('CANONICAL_CATEGORIES: ' + JSON.stringify(catNames));
        console.log('PRODUCT_CATEGORY_COLUMN: ' + JSON.stringify(prodCategories));

        const catNamesLower = catNames.map(n => n.toLowerCase().trim());

        console.log('\n--- ANALYSIS ---');
        prodCategories.forEach(pc => {
            if (!pc) return;
            const pcl = pc.toLowerCase().trim();
            const match = catNames.find(cn => cn.toLowerCase().trim() === pcl);
            if (match) {
                if (match !== pc) {
                    console.log(`[CASING_MISMATCH] Product: "${pc}" vs Category Table: "${match}"`);
                }
            } else {
                console.log(`[NO_MATCH] Product category "${pc}" NOT found in categories table.`);
            }
        });

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

compareCategories();
