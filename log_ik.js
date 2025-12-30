require('dotenv').config({ path: '.env.local' });
const ImageKit = require('imagekit');

const ik = new ImageKit({
    publicKey: process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.SECONDARY_IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_URL_ENDPOINT
});

async function list() {
    const files = await ik.listFiles({ limit: 1 });
    const url = files[0].url;
    let out = '';
    for (let i = 0; i < url.length; i += 10) out += url.substring(i, i + 10) + ' ';
    console.log(out);
}
list();
