require('dotenv').config({ path: '.env.local' });
const ImageKit = require('imagekit');
const { Client } = require('pg');

const ik = new ImageKit({
    publicKey: process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.SECONDARY_IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_URL_ENDPOINT
});

async function run() {
    const files = await ik.listFiles({ limit: 10, path: '/products' });
    files.forEach(f => {
        console.log(`F: ${f.url.substring(0, 50)}...${f.url.substring(f.url.length - 20)}`);
    });
}
run();
