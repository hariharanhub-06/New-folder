const https = require('https');
const url = 'https://ik.imagekit.io/6k5vfwl1j/products/tr:w-400,q-75,f-auto/1735551891472-584720679-blob_BkZTW';

https.get(url, (res) => {
    console.log(`Status: ${res.statusCode}`);
    if (res.statusCode === 200) {
        console.log('✅ Transformation URL is working!');
    } else {
        console.log('❌ Transformation URL failed.');

        // Try alternate placement: before the whole path
        const altUrl = 'https://ik.imagekit.io/6k5vfwl1j/tr:w-400,q-75,f-auto/products/1735551891472-584720679-blob_BkZTW';
        https.get(altUrl, (res2) => {
            console.log(`Alt Status: ${res2.statusCode}`);
            if (res2.statusCode === 200) {
                console.log('✅ Alternate placement works!');
            }
        });
    }
}).on('error', (e) => console.error(e.message));
