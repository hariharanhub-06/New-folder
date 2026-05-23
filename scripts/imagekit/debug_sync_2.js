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

async function run() {
    try {
        await client.connect();
        const res = await client.query('SELECT name, image_url FROM products');
        console.log(`Found ${res.rows.length} products`);

        const mom = res.rows.find(p => p.name.includes('Mom fit'));
        console.log('Product Found:', JSON.stringify(mom, null, 2));

        const files = await ik.listFiles({ limit: 1000 });
        console.log(`Files in IK: ${files.length}`);

        const filename = mom.image_url.split('/').pop().split('?')[0];
        const file = files.find(f => f.name === filename);

        if (file) {
            console.log('✅ File found in IK!');
            console.log('URL in IK:', file.url);
        } else {
            console.log('❌ File NOT found in IK!');
            console.log('Filename we searched for:', filename);
            console.log('Sample filenames in IK:', files.slice(0, 3).map(f => f.name));
        }

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

run();
