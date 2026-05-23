const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function list() {
    let output = "";
    try {
        await client.connect();
        const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'");
        output += "Tables: " + res.rows.map(r => r.table_name).join(', ') + "\n";

        const cols = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products'");
        output += "Columns of products:\n";
        cols.rows.forEach(c => {
            output += `  - ${c.column_name} (${c.data_type})\n`;
        });

        fs.writeFileSync('schema_info_new.txt', output);
        console.log("Written to schema_info_new.txt");
    } catch (e) {
        fs.writeFileSync('schema_info_new.txt', "Error: " + e.message);
        console.error(e);
    } finally {
        await client.end();
    }
}

list();
