const https = require('https');
const url = 'https://ik.imagekit.io/6k5vfwl1j/products/1735551891472-584720679-blob_BkZTW?tr=w-400,q-75,f-auto';
https.get(url, (res) => {
    console.log(`Query Transformation: ${res.statusCode}`);
});
