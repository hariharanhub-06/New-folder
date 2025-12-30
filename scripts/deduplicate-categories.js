require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    ssl: true
});

async function deduplicate() {
    const client = await pool.connect();
    try {
        console.log("Fetching categories...");
        const res = await client.query('SELECT * FROM categories');
        const categories = res.rows;

        const groups = {};

        // Group by normalized name
        categories.forEach(c => {
            const norm = c.name.trim().toLowerCase();
            if (!groups[norm]) groups[norm] = [];
            groups[norm].push(c);
        });

        console.log(`Found ${Object.keys(groups).length} unique category names out of ${categories.length} total rows.`);

        for (const name in groups) {
            const group = groups[name];
            if (group.length > 1) {
                console.log(`\nProcessing duplicate group: "${name}" (${group.length} entries)`);

                // Pick winner: Prefer one with image_url, else oldest (lowest ID length usually or just first)
                // actually oldest created_at is best but we might not have it, let's pick one with image
                group.sort((a, b) => {
                    // prioritize having an image
                    if (a.image_url && !b.image_url) return -1;
                    if (!a.image_url && b.image_url) return 1;
                    // prioritize shorter trimmed name length (cleaner?) no, they are same normalized
                    return 0;
                });

                const winner = group[0];
                const losers = group.slice(1);

                console.log(`  Winner: "${winner.name}" (ID: ${winner.id})`);

                for (const loser of losers) {
                    console.log(`  Merging loser: "${loser.name}" (ID: ${loser.id}) -> "${winner.name}"`);

                    // 1. Update products to use winner's name
                    // We use the EXACT name of the winner to ensure exact matching in future
                    const updateRes = await client.query(
                        'UPDATE products SET category = $1 WHERE category = $2',
                        [winner.name, loser.name]
                    );
                    console.log(`    Migrated ${updateRes.rowCount} products.`);

                    // 2. Delete loser category
                    await client.query('DELETE FROM categories WHERE id = $1', [loser.id]);
                    console.log(`    Deleted category row.`);
                }
            }
        }

        console.log("\nDeduplication complete!");

    } catch (e) {
        console.error("Error:", e);
    } finally {
        client.release();
        pool.end();
    }
}

deduplicate();
