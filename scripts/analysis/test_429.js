const https = require('https');
const url = 'https://ik.imagekit.io/6k5vfwl1j/tr:w-400,q-75,f-auto/products/1766868296506-870054456-blob_appPag8pSq?updatedAt=1767098419658';

https.get(url, (res) => {
    console.log(`URL: ${url}`);
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}`);
}).on('error', (e) => console.log(e.message));
