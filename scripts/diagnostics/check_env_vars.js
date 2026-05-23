
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync(path.resolve('.env.local')));

const keys = [
    'NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY',
    'IMAGEKIT_PRIVATE_KEY',
    'NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT',
    'NEXT_PUBLIC_SECONDARY_IMAGEKIT_PUBLIC_KEY',
    'SECONDARY_IMAGEKIT_PRIVATE_KEY',
    'NEXT_PUBLIC_SECONDARY_IMAGEKIT_URL_ENDPOINT'
];

keys.forEach(key => {
    const val = envConfig[key];
    if (val) {
        console.log(`${key}: PRESENT (Value starts with ${val.substring(0, 5)}...)`);
    } else {
        console.log(`${key}: MISSING`);
    }
});
