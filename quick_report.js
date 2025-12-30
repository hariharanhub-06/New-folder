require('dotenv').config({ path: '.env.local' });
const ImageKit = require('imagekit');
const { Client } = require('pg');

const secondaryIK = new ImageKit({
    publicKey: process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.SECONDARY_IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_URL_ENDPOINT
});

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function report() {
    try {
        await client.connect();

        const secondaryFiles = await secondaryIK.listFiles({ path: '/products', limit: 1000 });
        const secondaryCount = secondaryFiles.length;

        const dbRes = await client.query('SELECT COUNT(*) FROM products WHERE image_url LIKE \'%6k5vfwl1j%\'');
        const countInDb = dbRes.rows[0].count;

        const totalRes = await client.query('SELECT COUNT(*) FROM products');
        const total = totalRes.rows[0].count;

        console.log(`\n--- STATUS REPORT ---`);
        console.log(`Total Products: ${total}`);
        console.log(`Products pointing to Secondary: ${countInDb}`);
        console.log(`Files actually in Secondary: ${secondaryCount}`);
        console.log(`----------------------\n`);

    } catch (e) {
        console.log(e.message);
    } finally {
        await client.end();
    }
}

report();
