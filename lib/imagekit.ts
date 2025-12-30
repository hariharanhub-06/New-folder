import ImageKit from "imagekit";

// Helper to prevent build crashes if keys are missing (common in CI/CD)
const safeInit = (publicKey?: string, privateKey?: string, urlEndpoint?: string) => {
    if (!publicKey || !privateKey || !urlEndpoint) return null;
    return new ImageKit({ publicKey, privateKey, urlEndpoint });
};

const imagekit = safeInit(
    process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
    process.env.IMAGEKIT_PRIVATE_KEY,
    process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT
) || new ImageKit({
    publicKey: "placeholder",
    privateKey: "placeholder",
    urlEndpoint: "https://ik.imagekit.io/placeholder"
});

export const imagekitSecondary = safeInit(
    process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_PUBLIC_KEY,
    process.env.SECONDARY_IMAGEKIT_PRIVATE_KEY,
    process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_URL_ENDPOINT
);

export default imagekit;
