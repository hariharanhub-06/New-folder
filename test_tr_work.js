const https = require('https');
require('dotenv').config({ path: '.env.local' });
const ImageKit = require('imagekit');

const ik = new ImageKit({
    publicKey: process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.SECONDARY_IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_URL_ENDPOINT
});

async function testTransform() {
    const files = await ik.listFiles({ limit: 1 });
    const baseUrl = files[0].url.split('?')[0];
    const endpoint = process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_URL_ENDPOINT;

    // Construct transformation URL
    const path = baseUrl.replace(endpoint, '');
    const trUrl = `${endpoint}/tr:w-100${path}`;

    console.log(`Original URL: ${baseUrl}`);
    console.log(`Transformed URL: ${trUrl}`);

    https.get(trUrl, (res) => {
        console.log(`Status: ${res.statusCode}`);
    });
}

testTransform();
