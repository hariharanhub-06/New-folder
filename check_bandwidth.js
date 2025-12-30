const https = require('https');
require('dotenv').config({ path: '.env.local' });

const url = 'https://ik.imagekit.io/lzmpwlx08/products/1735551891472-584720679-blob_BkZTW';

https.get(url, (res) => {
    console.log(`Status: ${res.statusCode}`);
    if (res.statusCode === 200) {
        console.log('✅ Bandwidth is available! Migration can proceed.');
    } else if (res.statusCode === 429) {
        console.log('❌ Still 429 Bandwidth Limit Exceeded.');
    } else {
        console.log(`ℹ️ Status: ${res.statusCode}`);
    }
}).on('error', (e) => {
    console.error(e.message);
});
