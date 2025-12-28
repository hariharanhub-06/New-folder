// Script to find duplicate categories and save results to a file
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function findDuplicateCategories() {
    const client = await pool.connect();
    let output = '';

    try {
        output += '\n🔍 Searching for duplicate categories...\n\n';

        const result = await client.query(`
            SELECT id, name, image_url, is_active, created_at 
            FROM categories 
            ORDER BY name, created_at
        `);

        const categories = result.rows;
        const nameGroups = {};

        categories.forEach(cat => {
            const normalizedName = cat.name.trim().toUpperCase();
            if (!nameGroups[normalizedName]) {
                nameGroups[normalizedName] = [];
            }
            nameGroups[normalizedName].push(cat);
        });

        const duplicates = Object.entries(nameGroups).filter(([name, cats]) => cats.length > 1);

        if (duplicates.length === 0) {
            output += '✅ No duplicates found! Your categories are clean.\n\n';
            console.log(output);
            fs.writeFileSync(path.join(__dirname, 'duplicate-categories-report.txt'), output);
            return;
        }

        output += `⚠️  Found ${duplicates.length} duplicate category name(s):\n\n`;

        for (const [normalizedName, cats] of duplicates) {
            output += `📁 Category: "${cats[0].name}" (${cats.length} entries)\n`;
            output += '─'.repeat(60) + '\n';

            cats.forEach((cat, index) => {
                output += `  ${index + 1}. ID: ${cat.id}\n`;
                output += `     Original Name: "${cat.name}"\n`;
                output += `     Has Image: ${cat.image_url ? '✅ Yes' : '❌ No'}\n`;
                output += `     Active: ${cat.is_active ? '✅ Yes' : '❌ No'}\n`;
                output += `     Created: ${cat.created_at}\n`;
                if (cat.image_url) {
                    output += `     Image URL: ${cat.image_url}\n`;
                }
                output += '\n';
            });

            const withImage = cats.filter(c => c.image_url);
            const active = cats.filter(c => c.is_active);

            output += '  💡 RECOMMENDATION:\n';
            if (withImage.length === 1) {
                const keepIndex = cats.indexOf(withImage[0]) + 1;
                output += `     KEEP entry #${keepIndex} (has image)\n`;
                output += `     DELETE: ${cats.filter((_, i) => i !== keepIndex - 1).map((c, i) => `#${cats.indexOf(c) + 1}`).join(', ')}\n`;
            } else if (active.length === 1) {
                const keepIndex = cats.indexOf(active[0]) + 1;
                output += `     KEEP entry #${keepIndex} (is active)\n`;
                output += `     DELETE: ${cats.filter((_, i) => i !== keepIndex - 1).map((c, i) => `#${cats.indexOf(c) + 1}`).join(', ')}\n`;
            } else {
                output += `     KEEP entry #1 (oldest/created first)\n`;
                output += `     DELETE: #2${cats.length > 2 ? `, #3${cats.length > 3 ? ', etc.' : ''}` : ''}\n`;
            }

            output += '\n  🗑️  TO DELETE THESE IDs:\n';
            cats.forEach((cat, index) => {
                if (index > 0 || withImage.length === 0) {
                    output += `     DELETE ID: ${cat.id}\n`;
                }
            });
            output += '\n' + '='.repeat(60) + '\n\n';
        }

        output += '\n📋 NEXT STEPS:\n';
        output += '   1. Review the report above\n';
        output += '   2. Go to Admin > Categories in your website\n';
        output += '   3. Delete the duplicate entries (IDs listed above)\n';
        output += '   4. Keep the recommended entry for each category\n\n';

        console.log(output);

        const reportPath = path.join(__dirname, 'duplicate-categories-report.txt');
        fs.writeFileSync(reportPath, output);
        console.log(`\n📄 Full report saved to: ${reportPath}\n`);

    } catch (error) {
        output += `\n❌ Error: ${error.message}\n`;
        console.error(output);
        fs.writeFileSync(path.join(__dirname, 'duplicate-categories-report.txt'), output);
    } finally {
        client.release();
        await pool.end();
    }
}

findDuplicateCategories();
