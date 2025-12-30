
require('dotenv').config({ path: '.env.local' });

const expectedConfig = {
    NEXT_PUBLIC_SECONDARY_IMAGEKIT_PUBLIC_KEY: 'public_3yc/VziVx9UloGUTUZTij7iGXh0=',
    SECONDARY_IMAGEKIT_PRIVATE_KEY: 'private_BRNmiP5zNCS4M2hkWVDD+5rZprs=',
    NEXT_PUBLIC_SECONDARY_IMAGEKIT_URL_ENDPOINT: 'https://ik.imagekit.io/6k5vfwl1j'
};

let hasDiff = false;

for (const [key, value] of Object.entries(expectedConfig)) {
    if (process.env[key] !== value) {
        console.log(`MISMATCH: ${key}`);
        console.log(`  Current: ${process.env[key]}`);
        console.log(`  Expected: ${value}`);
        hasDiff = true;
    } else {
        console.log(`MATCH: ${key}`);
    }
}

if (!hasDiff) {
    console.log("ALL KEYS MATCH.");
}
