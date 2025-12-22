
const { Pool } = require('pg');
const ImageKit = require('imagekit');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
const migrationEnvPath = path.resolve(process.cwd(), '.env.migration');
const envPath = path.resolve(process.cwd(), '.env.local');

if (fs.existsSync(migrationEnvPath)) {
    console.log("Loading .env.migration...");
    dotenv.config({ path: migrationEnvPath });
} else if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    dotenv.config();
}

const oldConnectionString = process.argv[2];
const newConnectionString = process.env.DATABASE_URL;

if (!oldConnectionString) {
    console.error("Error: Please provide the OLD database connection string as an argument.");
    console.log("Usage: node scripts/migrate-full.js \"postgres://...\"");
    process.exit(1);
}

if (!newConnectionString) {
    console.error("Error: NEW database connection string (DATABASE_URL) not found in environment.");
    process.exit(1);
}

// Setup ImageKit
const imagekit = new ImageKit({
    publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT
});

const oldPool = new Pool({
    connectionString: oldConnectionString,
    ssl: { rejectUnauthorized: false }
});

const newPool = new Pool({
    connectionString: newConnectionString,
    ssl: { rejectUnauthorized: false }
});

async function uploadToImageKit(base64Data, fileName) {
    try {
        console.log(`Uploading ${fileName} to ImageKit...`);
        const response = await imagekit.upload({
            file: base64Data, // required
            fileName: fileName, // required
            folder: '/migrated-products/'
        });
        return response.url;
    } catch (error) {
        console.error("ImageKit upload failed:", error.message);
        return null; // Keep original if upload fails? Or empty? separate decision.
    }
}

async function migrate() {
    console.log("Attempting to connect to old database...");
    let oldClient;
    try {
        oldClient = await oldPool.connect();
        console.log("Connected to OLD database.");
    } catch (e) {
        console.error("Failed to connect to OLD database:", e.message, e.stack);
        process.exit(1);
    }

    console.log("Attempting to connect to new database...");
    let newClient;
    try {
        newClient = await newPool.connect();
        console.log("Connected to NEW database.");
    } catch (e) {
        console.error("Failed to connect to NEW database:", e.message, e.stack);
        if (oldClient) oldClient.release();
        process.exit(1);
    }

    try {
        console.log("Connected to both databases successfully.");

        // 1. Migrate Admins
        console.log("\n--- Migrating Admins ---");
        const admins = await oldClient.query('SELECT * FROM admins');
        for (const admin of admins.rows) {
            // Check if exists
            const existing = await newClient.query('SELECT id FROM admins WHERE username = $1', [admin.username]);
            if (existing.rows.length === 0) {
                await newClient.query(
                    'INSERT INTO admins (id, username, password, created_at) VALUES ($1, $2, $3, $4)',
                    [admin.id, admin.username, admin.password, admin.created_at]
                );
                console.log(`Copied admin: ${admin.username}`);
            } else {
                console.log(`Skipping admin ${admin.username} (already exists)`);
            }
        }

        // 2. Migrate Products (with Image Optimization)
        console.log("\n--- Migrating Products ---");
        const products = await oldClient.query('SELECT * FROM products');

        for (const product of products.rows) {
            let changesMade = false;
            let imageUrl = product.image_url;
            let images = [];

            // Handle parsing of images column safely (it might be JSONB or String in OLD db)
            try {
                if (typeof product.images === 'string') {
                    images = JSON.parse(product.images);
                } else if (Array.isArray(product.images)) {
                    images = product.images;
                }
            } catch (e) {
                console.warn(`Failed to parse images for product ${product.id}`, e);
                images = [];
            }

            // Process Main Image
            if (imageUrl && imageUrl.startsWith('data:image')) {
                const newUrl = await uploadToImageKit(imageUrl, `main-${product.id}`);
                if (newUrl) {
                    imageUrl = newUrl;
                    changesMade = true;
                }
            }

            // Process Gallery Images
            const newImages = [];
            for (let i = 0; i < images.length; i++) {
                const img = images[i];
                if (img && img.startsWith('data:image')) {
                    const newUrl = await uploadToImageKit(img, `gallery-${product.id}-${i}`);
                    if (newUrl) {
                        newImages.push(newUrl);
                        changesMade = true;
                    } else {
                        newImages.push(img); // Keep original if fail
                    }
                } else {
                    newImages.push(img);
                }
            }

            // Insert into New DB
            // Check existence
            const existing = await newClient.query('SELECT id FROM products WHERE id = $1', [product.id]);
            if (existing.rows.length === 0) {
                await newClient.query(`
                    INSERT INTO products (id, name, description, price, category, stock, image_url, images, is_active, size, weight, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                `, [
                    product.id,
                    product.name,
                    product.description,
                    product.price,
                    product.category,
                    product.stock,
                    imageUrl,
                    JSON.stringify(newImages),
                    product.is_active,
                    product.size,
                    product.weight || 750,
                    product.created_at,
                    product.updated_at
                ]);
                console.log(`Migrated product: ${product.name} ${changesMade ? '(Optimized Images)' : ''}`);

                // Migrate Product Sizes
                const sizes = await oldClient.query('SELECT * FROM product_sizes WHERE product_id = $1', [product.id]);
                for (const s of sizes.rows) {
                    await newClient.query(
                        'INSERT INTO product_sizes (id, product_id, size, stock) VALUES ($1, $2, $3, $4)',
                        [s.id, s.product_id, s.size, s.stock]
                    );
                }
            } else {
                console.log(`Skipping product ${product.name} (already exists)`);
            }
        }

        // 3. Migrate Orders
        console.log("\n--- Migrating Orders ---");
        const orders = await oldClient.query('SELECT * FROM orders');
        for (const order of orders.rows) {
            const existing = await newClient.query('SELECT id FROM orders WHERE id = $1', [order.id]);
            if (existing.rows.length === 0) {
                await newClient.query(`
                    INSERT INTO orders (
                        id, customer_name, customer_email, customer_mobile, shipping_address, 
                        total_amount, shipping_cost, status, transaction_id, 
                        cashfree_order_id, cashfree_payment_id, logistics_id, courier_name, 
                        created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                `, [
                    order.id, order.customer_name, order.customer_email, order.customer_mobile, order.shipping_address,
                    order.total_amount, order.shipping_cost, order.status, order.transaction_id,
                    order.cashfree_order_id, order.cashfree_payment_id, order.logistics_id, order.courier_name,
                    order.created_at, order.updated_at
                ]);

                // Migrate Order Items
                const items = await oldClient.query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
                for (const item of items.rows) {
                    await newClient.query(`
                        INSERT INTO order_items (order_id, product_id, name, quantity, price)
                        VALUES ($1, $2, $3, $4, $5)
                    `, [item.order_id, item.product_id, item.name, item.quantity, item.price]);
                }
                console.log(`Migrated order: ${order.id}`);
            }
        }

        // 4. Migrate Discounts
        console.log("\n--- Migrating Discounts ---");
        const discounts = await oldClient.query('SELECT * FROM discounts');
        for (const d of discounts.rows) {
            const existing = await newClient.query('SELECT id FROM discounts WHERE id = $1', [d.id]);
            if (existing.rows.length === 0) {
                await newClient.query(`
                    INSERT INTO discounts (id, product_id, quantity, price, discount_type, target_type, category, percentage, active, created_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                 `, [d.id, d.product_id, d.quantity, d.price, d.discount_type, d.target_type, d.category, d.percentage, d.active, d.created_at]);
                console.log(`Migrated discount: ${d.id}`);
            }
        }

        console.log("\n✅ Migration Complete!");

    } catch (e) {
        console.error("\n❌ Migration Failed:", e);
    } finally {
        oldClient.release();
        newClient.release();
        await oldPool.end();
        await newPool.end();
    }
}

migrate();
