
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function listTables() {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;
    const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

    try {
        const res = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log("ALL_TABLES:");
        res.rows.forEach(r => console.log(`- ${r.table_name}`));
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await pool.end();
    }
}

listTables();
