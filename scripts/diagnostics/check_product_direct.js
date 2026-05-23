require('dotenv').config({ path: '.env.local' });

const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkLatestProduct() {
    try {
        await client.connect();

        const result = await client.query(`
            SELECT name, image_url, images, created_at
            FROM products
            ORDER BY created_at DESC
            LIMIT 1
        `);

        if (result.rows.length === 0) {
            console.log("No products found.");
            return;
        }

        const product = result.rows[0];

        console.log("Latest Product:", product.name);
        console.log("Image URL:", product.image_url || "N/A");
        console.log("Created At:", product.created_at);

        // Check if URL contains the old or new endpoint ID
        const oldId = "lzmpw";
        const newId = "6k5vfwl1j";

        if (product.image_url && product.image_url.includes(oldId)) {
            console.log("\n⚠️  WARNING: Product is using the OLD ImageKit ID (lzmpw)");
            console.log("This account is rate-limited (429 errors)");
            console.log("SOLUTION: Delete and re-upload this image in the product edit form");
        } else if (product.image_url && product.image_url.includes(newId)) {
            console.log("\n✅ SUCCESS: Product is using the NEW ImageKit ID (6k5vfwl1j)");
        } else {
            console.log("\nℹ️  INFO: Product has no image or uses external URL");
            console.log("Image URL:", product.image_url);
        }

    } catch (e) {
        console.error("Error:", e.message);
    } finally {
        await client.end();
    }
}

checkLatestProduct();
