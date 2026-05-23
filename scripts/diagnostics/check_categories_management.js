
const { Pool } = require('pg');

const connectionString = 'postgresql://neondb_owner:npg_3hgCudc2TDEv@ep-spring-star-ahc1v027-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const pool = new Pool({ connectionString, ssl: true });

async function check() {
    try {
        const res = await pool.query('SELECT * FROM categories');
        console.log('Categories Table Content:', JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

check();
