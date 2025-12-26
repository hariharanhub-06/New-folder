require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function migrate() {
    try {
        console.log('Starting category migration...');

        // Update Trousers to Pant
        const res1 = await pool.query("UPDATE products SET category = 'Pant' WHERE category = 'Trousers'");
        console.log(`Updated ${res1.rowCount} Trousers to Pant`);

        // Update Pants to Pant
        const res2 = await pool.query("UPDATE products SET category = 'Pant' WHERE category = 'Pants'");
        console.log(`Updated ${res2.rowCount} Pants to Pant`);

        // Update t-Shirt to T-Shirt
        const res3 = await pool.query("UPDATE products SET category = 'T-Shirt' WHERE category = 't-Shirt'");
        console.log(`Updated ${res3.rowCount} t-Shirt to T-Shirt`);

        // Update Shirts to Shirt
        const res4 = await pool.query("UPDATE products SET category = 'Shirt' WHERE category = 'Shirts'");
        console.log(`Updated ${res4.rowCount} Shirts to Shirt`);

        // Update Accessories to Accessory
        const res5 = await pool.query("UPDATE products SET category = 'Accessory' WHERE category = 'Accessories'");
        console.log(`Updated ${res5.rowCount} Accessories to Accessory`);

        console.log('Migration complete!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();
