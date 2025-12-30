
require('dotenv').config({ path: '.env.local' });

if (!process.env.SECONDARY_IMAGEKIT_PRIVATE_KEY) {
    console.log("MISSING: SECONDARY_IMAGEKIT_PRIVATE_KEY is not set.");
} else {
    console.log("PRESENT: SECONDARY_IMAGEKIT_PRIVATE_KEY is set.");
    console.log("Value starts with:", process.env.SECONDARY_IMAGEKIT_PRIVATE_KEY.substring(0, 5));
}

if (!process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_PUBLIC_KEY) {
    console.log("MISSING: NEXT_PUBLIC_SECONDARY_IMAGEKIT_PUBLIC_KEY is not set.");
} else {
    console.log("PRESENT: NEXT_PUBLIC_SECONDARY_IMAGEKIT_PUBLIC_KEY is set.");
}
