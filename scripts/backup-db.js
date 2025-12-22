
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Use argument if provided, otherwise fallback to env var
const connectionString = process.argv[2] || process.env.DATABASE_URL;

if (!connectionString) {
    console.error("\x1b[31m%s\x1b[0m", "Error: No connection string provided.");
    console.log("Usage: node scripts/backup-db.js \"postgres://...\" OR set DATABASE_URL env var");
    process.exit(1);
}

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function backup() {
    const client = await pool.connect();
    console.log("Connecting to database...");

    try {
        const data = {};

        // List of tables to backup
        const tables = ['admins', 'products', 'product_sizes', 'discounts', 'orders', 'order_items'];

        for (const table of tables) {
            console.log(`Backing up table: ${table}...`);
            try {
                const res = await client.query(`SELECT * FROM ${table}`);
                data[table] = res.rows;
                console.log(`  -> Retrieved ${res.rows.length} records.`);
            } catch (err) {
                console.warn(`  -> Warning: Could not fetch table ${table} (it might not exist).`);
            }
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup-${timestamp}.json`;
        const filePath = path.join(process.cwd(), filename);

        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

        console.log("\x1b[32m%s\x1b[0m", `\n✅ Backup successful! Saved to: ${filename}`);

    } catch (error) {
        console.error("\x1b[31m%s\x1b[0m", "\n❌ Backup failed:");
        console.error(error);
    } finally {
        client.release();
        pool.end();
    }
}

backup();
