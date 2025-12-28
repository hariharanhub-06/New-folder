const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function sync() {
    try {
        console.log('--- CATEGORY SYNC START ---');

        // 1. Get canonical names
        const catRes = await pool.query('SELECT name FROM categories');
        const canonicalNames = catRes.rows.map(r => r.name);

        // 2. Get unique product categories
        const prodRes = await pool.query('SELECT DISTINCT category FROM products WHERE category IS NOT NULL');
        const prodCats = prodRes.rows.map(r => r.category);

        for (const pc of prodCats) {
            const normalizedPc = pc.trim().toLowerCase();

            // Look for a close match
            const match = canonicalNames.find(cn => {
                const cnl = cn.trim().toLowerCase();
                return cnl === normalizedPc ||
                    cnl === normalizedPc + 's' ||
                    normalizedPc === cnl + 's' ||
                    cnl.replace(/\s/g, '') === normalizedPc.replace(/\s/g, '');
            });

            if (match && match !== pc) {
                console.log(`Updating "${pc}" -> "${match}"`);
                await pool.query('UPDATE products SET category = $1 WHERE category = $2', [match, pc]);
            } else if (!match) {
                console.warn(`No match found for product category: "${pc}"`);
            }
        }

        console.log('--- SYNC COMPLETE ---');
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

sync();
