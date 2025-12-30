
require('dotenv').config({ path: '.env.local' });
const ImageKit = require('imagekit');

const safeInit = (publicKey, privateKey, urlEndpoint) => {
    if (!publicKey || !privateKey || !urlEndpoint) {
        console.log(`Missing config: Public=${!!publicKey}, Private=${!!privateKey}, Url=${!!urlEndpoint}`);
        return null;
    }
    try {
        const ik = new ImageKit({ publicKey, privateKey, urlEndpoint });
        console.log(`Successfully initialized ImageKit for endpoint: ${urlEndpoint}`);
        return ik;
    } catch (e) {
        console.error("Failed to init ImageKit:", e.message);
        return null;
    }
};

console.log("Checking Primary...");
safeInit(
    process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
    process.env.IMAGEKIT_PRIVATE_KEY,
    process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT
);

console.log("\nChecking Secondary...");
safeInit(
    process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_PUBLIC_KEY,
    process.env.SECONDARY_IMAGEKIT_PRIVATE_KEY,
    process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_URL_ENDPOINT
);
