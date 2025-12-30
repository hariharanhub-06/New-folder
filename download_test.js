const https = require('https');
const fs = require('fs');

const url = 'https://ik.imagekit.io/6k5vfwl1j/products/1735551891472-584720679-blob_BkZTW?updatedAt=1767098485237';

https.get(url, (res) => {
    if (res.statusCode === 200) {
        const file = fs.createWriteStream("test_img.jpg");
        res.pipe(file);
        file.on('finish', () => {
            console.log('✅ Image downloaded successfully!');
            file.close();
        });
    } else {
        console.log(`❌ Failed: ${res.statusCode}`);
    }
});
