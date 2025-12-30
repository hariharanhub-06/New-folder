const ImageKit = require("imagekit");
require('dotenv').config({ path: '.env.local' });

const imagekitSecondary = new ImageKit({
    publicKey: process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.SECONDARY_IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_URL_ENDPOINT,
});

async function testUpload() {
    console.log("Testing upload (Base64) to:", process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_URL_ENDPOINT);
    try {
        const base64Image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="; // 1x1 red pixel
        const result = await imagekitSecondary.upload({
            file: base64Image,
            fileName: "test-pixel.png",
            folder: "/test"
        });
        console.log("Upload Success!");
        console.log("URL:", result.url);
        console.log("File ID:", result.fileId);
    } catch (error) {
        console.error("Upload Failed:", error);
    }
}

testUpload();
