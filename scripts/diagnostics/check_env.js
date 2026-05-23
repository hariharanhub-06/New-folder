require('dotenv').config({ path: '.env.local' });

console.log("Checking Environment Variables...");
console.log("Secondary Public Key Present:", !!process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_PUBLIC_KEY);
console.log("Secondary Private Key Present:", !!process.env.SECONDARY_IMAGEKIT_PRIVATE_KEY);
console.log("Secondary Endpoint Present:", !!process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_URL_ENDPOINT);

if (process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_URL_ENDPOINT) {
    console.log("Secondary Endpoint Value:", process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_URL_ENDPOINT);
} else {
    console.log("Secondary Endpoint MISSING");
}
