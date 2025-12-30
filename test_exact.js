const https = require('https');
require('dotenv').config({ path: '.env.local' });
const ImageKit = require('imagekit');

const ik = new ImageKit({
    publicKey: process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.SECONDARY_IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_URL_ENDPOINT
});

async function testExact() {
    const files = await ik.listFiles({ limit: 1 });
    const url = files[0].url;
    console.log(`Testing URL from listFiles: ${url}`);

    https.get(url, (res) => {
        console.log(`Status: ${res.statusCode}`);
    });
}

testExact();
