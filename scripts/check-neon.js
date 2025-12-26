
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkPlayingWithNeon() {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;
    const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

    try {
        const res = await pool.query('SELECT * FROM playing_with_neon LIMIT 10');
        console.log("PLAYING_WITH_NEON_DATA:" + JSON.stringify(res.rows));
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await pool.end();
    }
}

checkPlayingWithNeon();
