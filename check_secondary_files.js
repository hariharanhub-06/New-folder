require('dotenv').config({ path: '.env.local' });
const ImageKit = require('imagekit');

const ik = new ImageKit({
    publicKey: process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.SECONDARY_IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_URL_ENDPOINT
});

async function check() {
    try {
        const files = await ik.listFiles({ path: '/products', limit: 1000 });
        console.log(`Found ${files.length} files in secondary account /products folder.`);
        if (files.length > 0) {
            console.log("Sample filenames:");
            files.slice(0, 10).forEach(f => console.log(` - ${f.name}`));
        }
    } catch (e) {
        console.error(e);
    }
}

check();
