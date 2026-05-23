const https = require('https');
const url = 'https://ik.imagekit.io/6k5vfwl1j/products/1735551891472-584720679-blob_BkZTW';
https.get(url, (res) => {
    console.log(`Original without Query: ${res.statusCode}`);
});
