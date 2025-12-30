const https = require('https');
const url = 'https://ik.imagekit.io/6k5vfwl1j/tr:w-10/products/1766868287941-26795415-blob_BkdCsz8';

https.get(url, (res) => {
    console.log(`URL: ${url}`);
    console.log(`Status: ${res.statusCode}`);
}).on('error', (e) => console.log(e.message));
