const https = require('https');
const url = 'https://ik.imagekit.io/6k5vfwl1j/products/1766318997380-496528955?updatedAt=1767098528955';
https.get(url, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
});
