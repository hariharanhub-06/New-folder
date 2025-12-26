const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
    try {
        console.log("Checking unique constraints for 'orders' table...");
        const res = await pool.query(`
            SELECT
                conname as constraint_name,
                pg_get_constraintdef(c.oid) as constraint_definition
            FROM pg_constraint c
            JOIN pg_namespace n ON n.oid = c.connamespace
            WHERE n.nspname = 'public'
            AND conrelid = 'orders'::regclass;
        `);

        console.log("CONSTRAINTS_START");
        console.log(JSON.stringify(res.rows));
        console.log("CONSTRAINTS_END");

        console.log("\nINDEXES_START");
        const idxRes = await pool.query(`
            SELECT
                indexname,
                indexdef
            FROM pg_indexes
            WHERE tablename = 'orders';
        `);
        console.log(JSON.stringify(idxRes.rows));
        console.log("INDEXES_END");

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkSchema();
