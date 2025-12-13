
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true
});

async function checkTables() {
    try {
        const res = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);

        console.log("Existing tables:", res.rows.map(r => r.table_name));

        // specifically check product_sizes
        const sizesTable = res.rows.find(r => r.table_name === 'product_sizes');
        if (sizesTable) {
            console.log("✅ 'product_sizes' table exists.");
            // Check columns
            const cols = await pool.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'product_sizes'
            `);
            console.log("Columns in product_sizes:", cols.rows.map(c => `${c.column_name} (${c.data_type})`));

        } else {
            console.log("❌ 'product_sizes' table MISSING.");
        }

    } catch (e) {
        console.error("Error checking DB:", e);
    } finally {
        await pool.end();
    }
}

checkTables();
