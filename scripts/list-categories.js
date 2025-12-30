const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    ssl: true
});

async function listCategories() {
    try {
        const res = await pool.query(`
      SELECT id, name, product_count 
      FROM (
        SELECT c.id, c.name, COUNT(p.id) as product_count
        FROM categories c
        LEFT JOIN products p ON c.name = p.category
        GROUP BY c.id, c.name
      ) sub
      ORDER BY name
    `);

        console.log("--- EXISTING CATEGORIES ---");
        res.rows.forEach(r => {
            console.log(`[${r.id}] "${r.name}" (Products: ${r.product_count})`);
        });
        console.log("---------------------------");
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

listCategories();
