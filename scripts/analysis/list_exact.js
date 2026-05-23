require('dotenv').config({ path: '.env.local' });
const ImageKit = require('imagekit');

const secondaryIK = new ImageKit({
    publicKey: process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.SECONDARY_IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_URL_ENDPOINT
});

async function list() {
    try {
        const files = await secondaryIK.listFiles({ path: '/products', limit: 2 });
        files.forEach(f => {
            console.log('NAME:', f.name);
            console.log('URL:', f.url);
        });
    } catch (e) {
        console.error(e);
    }
}

list();
