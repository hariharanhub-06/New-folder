const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkOrderItems() {
    try {
        console.log("Checking columns for 'order_items' table...");
        const colRes = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'order_items'
            ORDER BY ordinal_position;
        `);
        const cols = colRes.rows.map(r => r.column_name).join(', ');
        console.log("COLUMNS_LIST: " + cols);

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkOrderItems();
