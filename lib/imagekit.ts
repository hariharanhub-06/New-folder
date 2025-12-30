
import ImageKit from "imagekit";

const imagekit = new ImageKit({
    publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "",
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
    urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || "",
});

export const imagekitSecondary = new ImageKit({
    publicKey: process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_PUBLIC_KEY || "",
    privateKey: process.env.SECONDARY_IMAGEKIT_PRIVATE_KEY || "",
    urlEndpoint: process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_URL_ENDPOINT || "",
});

export default imagekit;
