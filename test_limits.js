const https = require('https');
require('dotenv').config({ path: '.env.local' });

async function testLimits() {
    const urls = [
        // Raw secondary
        'https://ik.imagekit.io/6k5vfwl1j/products/1766868296506-870054456-blob_appPag8pSq',
        // Transformed secondary
        'https://ik.imagekit.io/6k5vfwl1j/products/tr:w-400/1766868296506-870054456-blob_appPag8pSq',
        // Raw primary
        'https://ik.imagekit.io/lzmpwlx08/products/1766868296506-870054456-blob_appPag8pSq'
    ];

    for (const url of urls) {
        https.get(url, (res) => {
            console.log(`URL: ${url}`);
            console.log(`Status: ${res.statusCode}\n`);
        }).on('error', (e) => console.log(`Error ${url}: ${e.message}`));
    }
}

testLimits();
