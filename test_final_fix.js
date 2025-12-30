const https = require('https');
const url = 'https://ik.imagekit.io/6k5vfwl1j/tr:w-400,q-75,f-auto/products/1766868287941-26795415-blob_BkdCsz8?updatedAt=1767098287941';

https.get(url, (res) => {
    console.log(`URL: ${url}`);
    console.log(`Status: ${res.statusCode}`);
    if (res.statusCode === 200) {
        console.log('✅ Success! Images should load now.');
    } else {
        console.log(`❌ Failed with status ${res.statusCode}`);
    }
}).on('error', (e) => console.log(e.message));
