require('dotenv').config({ path: '.env.local' });
const ImageKit = require('imagekit');
const fs = require('fs');

const ik = new ImageKit({
    publicKey: process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.SECONDARY_IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_URL_ENDPOINT
});

async function list() {
    try {
        const files = await ik.listFiles({ limit: 1000 });
        const filenames = files.map(f => f.name).join('\n');
        fs.writeFileSync('C:\\Users\\Hari Haran\\Documents\\New folder\\all_filenames.txt', filenames);
        console.log(`Saved ${files.length} filenames.`);
    } catch (e) {
        console.error(e);
    }
}

list();
