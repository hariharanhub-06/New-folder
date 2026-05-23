require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function generateReUploadList() {
    try {
        await client.connect();

        // Get products with old URLs, ordered by sales count
        const result = await client.query(`
            SELECT 
                p.id,
                p.name,
                p.image_url,
                p.status,
                COUNT(DISTINCT oi.order_id) as order_count,
                CASE 
                    WHEN COUNT(DISTINCT oi.order_id) >= 5 THEN 'HIGH'
                    WHEN COUNT(DISTINCT oi.order_id) >= 2 THEN 'MEDIUM'
                    ELSE 'LOW'
                END as priority
            FROM products p
            LEFT JOIN order_items oi ON oi.product_id = p.id
            LEFT JOIN orders o ON o.id = oi.order_id AND o.status NOT IN ('Cancelled', 'Payment Failed')
            WHERE p.image_url LIKE '%lzmpw%'
            GROUP BY p.id, p.name, p.image_url, p.status
            ORDER BY order_count DESC, p.created_at DESC
        `);

        console.log("\n📋 PRODUCTS TO RE-UPLOAD (Sorted by Sales)\n");
        console.log("Priority | Product Name | Sales | Status");
        console.log("-".repeat(80));

        result.rows.forEach((row, idx) => {
            console.log(`${row.priority.padEnd(8)} | ${row.name.substring(0, 40).padEnd(40)} | ${String(row.order_count).padEnd(5)} | ${row.status}`);
        });

        console.log("\n" + "=".repeat(80));
        console.log(`Total affected products: ${result.rows.length}`);
        console.log(`HIGH priority (>=5 sales): ${result.rows.filter(r => r.priority === 'HIGH').length}`);
        console.log(`MEDIUM priority (2-4 sales): ${result.rows.filter(r => r.priority === 'MEDIUM').length}`);
        console.log(`LOW priority (<2 sales): ${result.rows.filter(r => r.priority === 'LOW').length}`);

        console.log("\n💡 Recommendation:");
        console.log("   1. Re-upload HIGH priority products first (biggest sales impact)");
        console.log("   2. Then MEDIUM priority products");
        console.log("   3. LOW priority can wait or skip if low-value items\n");

    } catch (e) {
        console.error("Error:", e.message);
    } finally {
        await client.end();
    }
}

generateReUploadList();
