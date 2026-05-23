require('dotenv').config({ path: '.env.local' });
const ImageKit = require('imagekit');
const { Client } = require('pg');

const ik = new ImageKit({
    publicKey: process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.SECONDARY_IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_URL_ENDPOINT
});

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function debugSync() {
    await client.connect();

    // 1. Get files from IK
    const files = await ik.listFiles({ limit: 100 });
    const fileMap = new Map();
    files.forEach(f => fileMap.set(f.name, f.url));
    console.log(`Files in IK: ${files.length}\n`);

    // 2. Get Mom fit jeans info
    const res = await client.query("SELECT id, name, image_url FROM products WHERE name = 'Mom fit jeans'");
    const p = res.rows[0];
    console.log(`Product: ${p.name}`);
    console.log(`Current URL in DB: ${p.image_url}`);

    const parts = p.image_url.split('/');
    const filename = parts.pop().split('?')[0];
    console.log(`Extracted filename: ${filename}`);

    if (fileMap.has(filename)) {
        const correctUrl = fileMap.get(filename);
        console.log(`FOUND in IK! Correct URL: ${correctUrl}`);
        if (p.image_url !== correctUrl) {
            console.log(`Updating DB...`);
            await client.query('UPDATE products SET image_url = $1 WHERE id = $2', [correctUrl, p.id]);
            console.log(`Done.`);
        } else {
            console.log(`Already correct.`);
        }
    } else {
        console.log(`❌ NOT FOUND in IK! Showing first 5 IK filenames:`);
        console.log(files.slice(0, 5).map(f => f.name));
    }

    await client.end();
}

debugSync().catch(console.error);
