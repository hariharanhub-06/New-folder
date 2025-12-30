const ImageKit = require("imagekit");
require('dotenv').config({ path: '.env.local' });

const imagekitSecondary = new ImageKit({
    publicKey: process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.SECONDARY_IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_URL_ENDPOINT,
});

async function testUpload() {
    console.log("Testing upload to:", process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_URL_ENDPOINT);
    try {
        const result = await imagekitSecondary.upload({
            file: "https://via.placeholder.com/150", // Upload from URL for simplicity
            fileName: "test-upload.jpg",
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
