require('dotenv').config({ path: '.env.local' });
const ImageKit = require('imagekit');
const fs = require('fs');

const secondaryIK = new ImageKit({
    publicKey: process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.SECONDARY_IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_URL_ENDPOINT
});

async function list() {
    try {
        const files = await secondaryIK.listFiles({ path: '/products', limit: 5 });
        let out = '';
        files.forEach(f => {
            out += `NAME: ${f.name}\nURL: ${f.url}\n\n`;
        });
        fs.writeFileSync('c:\\Users\\Hari Haran\\Documents\\New folder\\out.txt', out);
        console.log('Saved');
    } catch (e) {
        console.error(e);
    }
}

list();
