
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

async function fix() {
    console.log("Starting manual fix...");
    try {
        let connectionString = process.env.DATABASE_URL;

        if (!connectionString) {
            const files = ['.env.local', '.env.production', '.env'];
            for (const file of files) {
                const envPath = path.resolve(file);
                if (fs.existsSync(envPath)) {
                    console.log("Checking:", file);
                    const content = fs.readFileSync(envPath, 'utf8');
                    // debugging keys
                    const lines = content.split('\n');
                    lines.forEach(line => {
                        const parts = line.split('=');
                        if (parts.length > 1) {
                            console.log("Found KEY:", parts[0].trim());
                        }
                    });

                    // Look for key=value
                    const match = content.match(/DATABASE_URL=(.+)/);
                    if (match) {
                        connectionString = match[1].trim().replace(/^["']|["']$/g, '');
                        console.log(`Found DATABASE_URL in ${file}`);
                        break;
                    }
                }
            }
        }

        if (!connectionString) {
            console.error("No connection string found.");
            process.exit(1);
        }

        // Fix for "self-signed certificate" error if any
        const pool = new Pool({
            connectionString: connectionString,
            ssl: { rejectUnauthorized: false }
        });

        console.log("Connecting...");
        await pool.query('SELECT 1');
        console.log("Connected.");

        console.log("Creating table...");
        await pool.query(`
            CREATE TABLE IF NOT EXISTS product_sizes (
                id TEXT PRIMARY KEY,
                product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                size TEXT NOT NULL,
                stock INTEGER NOT NULL DEFAULT 0
            );
        `);
        console.log("Table 'product_sizes' created/verified.");

        await pool.end();
    } catch (e) {
        console.error("Error:", e);
    }
}

fix();
