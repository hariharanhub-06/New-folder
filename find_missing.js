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

async function findMissing() {
    try {
        await client.connect();

        const secondaryFiles = await secondaryIK.listFiles({ path: '/products', limit: 1000 });
        const secondaryFilenames = new Set(secondaryFiles.map(f => f.name));

        const res = await client.query('SELECT name, image_url FROM products');

        let missingCount = 0;
        const missingList = [];

        for (const row of res.rows) {
            const filename = row.image_url.split('/').pop().split('?')[0];
            if (!secondaryFilenames.has(filename)) {
                missingCount++;
                missingList.push({ name: row.name, filename });
            }
        }

        console.log(`Missing from Secondary: ${missingCount}`);
        if (missingCount > 0) {
            console.log('Sample missing:');
            console.log(JSON.stringify(missingList.slice(0, 5), null, 2));
        }

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

findMissing();
