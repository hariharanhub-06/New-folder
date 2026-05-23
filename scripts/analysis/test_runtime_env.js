require('dotenv').config({ path: '.env.local' });

console.log("=== RUNTIME ENV VAR CHECK ===\n");

const requiredVars = {
    "Primary Public": process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
    "Primary Private": process.env.IMAGEKIT_PRIVATE_KEY,
    "Primary URL": process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT,
    "Secondary Public": process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_PUBLIC_KEY,
    "Secondary Private": process.env.SECONDARY_IMAGEKIT_PRIVATE_KEY,
    "Secondary URL": process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_URL_ENDPOINT
};

for (const [key, value] of Object.entries(requiredVars)) {
    if (!value) {
        console.log(`❌ ${key}: MISSING`);
    } else {
        console.log(`✅ ${key}: ${value.substring(0, 15)}...`);
    }
}

// Now test ImageKit initialization
console.log("\n=== TESTING IMAGEKIT INIT ===\n");

const ImageKit = require('imagekit');

const safeInit = (publicKey, privateKey, urlEndpoint, name) => {
    if (!publicKey || !privateKey || !urlEndpoint) {
        console.log(`❌ ${name}: Missing keys`);
        return null;
    }
    try {
        const ik = new ImageKit({ publicKey, privateKey, urlEndpoint });
        console.log(`✅ ${name}: Successfully initialized`);
        return ik;
    } catch (e) {
        console.log(`❌ ${name}: Failed - ${e.message}`);
        return null;
    }
};

const primary = safeInit(
    process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
    process.env.IMAGEKIT_PRIVATE_KEY,
    process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT,
    "PRIMARY"
);

const secondary = safeInit(
    process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_PUBLIC_KEY,
    process.env.SECONDARY_IMAGEKIT_PRIVATE_KEY,
    process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_URL_ENDPOINT,
    "SECONDARY"
);

console.log("\n=== UPLOAD ROUTE LOGIC ===");
const uploader = secondary || primary;
console.log(`Upload will use: ${secondary ? "SECONDARY (New Account)" : "PRIMARY (Old - Rate Limited!)"}`);
