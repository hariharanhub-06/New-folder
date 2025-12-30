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

// Helper to optimize ImageKit URLs with transformations (bandwidth savings)
export function optimizeImageUrl(url: string | null | undefined, options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'auto';
} = {}): string {
    // Return fallback if no URL or not an ImageKit URL
    if (!url || !url.includes('imagekit.io')) {
        return url || "https://images.unsplash.com/photo-1552066344-24632e509613?q=80&w=1000&auto=format&fit=crop";
    }

    // Build transformation string
    const transformations = [];
    if (options.width) transformations.push(`w-${options.width}`);
    if (options.height) transformations.push(`h-${options.height}`);
    if (options.quality) transformations.push(`q-${options.quality || 75}`);
    if (options.format) transformations.push(`f-${options.format}`);

    if (transformations.length === 0) return url;

    const tr = transformations.join(',');

    // Insert transformation before the filename
    // Example: /products/image.jpg -> /products/tr:w-400,q-75/image.jpg
    const parts = url.split('/');
    const filename = parts.pop();
    return `${parts.join('/')}/tr:${tr}/${filename}`;
}

export default imagekit;
