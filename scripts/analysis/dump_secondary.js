require('dotenv').config({ path: '.env.local' });
const ImageKit = require('imagekit');
const fs = require('fs');

const ik = new ImageKit({
    publicKey: process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.SECONDARY_IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_URL_ENDPOINT
});

async function check() {
    try {
        let allFiles = [];
        let limit = 1000;
        let skip = 0;
        while (true) {
            const batch = await ik.listFiles({ path: '/products', limit, skip });
            allFiles = allFiles.concat(batch);
            if (batch.length < limit) break;
            skip += limit;
        }
        fs.writeFileSync('secondary_files_full.json', JSON.stringify(allFiles, null, 2));
        console.log(`Saved ${allFiles.length} files to secondary_files_full.json`);
    } catch (e) {
        console.error(e);
    }
}

check();
