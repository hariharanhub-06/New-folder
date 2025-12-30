require('dotenv').config({ path: '.env.local' });
const ImageKit = require('imagekit');

const ik = new ImageKit({
    publicKey: process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.SECONDARY_IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_URL_ENDPOINT
});

async function list() {
    try {
        const files = await ik.listFiles({ limit: 10 });
        console.log('Files in Secondary Account:');
        files.forEach(f => {
            console.log(`- Path: ${f.filePath}`);
            console.log(`  URL:  ${f.url}`);
        });
    } catch (e) {
        console.error(e);
    }
}

list();
