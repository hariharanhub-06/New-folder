import ImageKit from "imagekit";

// Helper to prevent build crashes if keys are missing (common in CI/CD)
const safeInit = (publicKey?: string, privateKey?: string, urlEndpoint?: string) => {
    if (!publicKey || !privateKey || !urlEndpoint) return null;
    return new ImageKit({ publicKey, privateKey, urlEndpoint });
};

// SECONDARY ACCOUNT (6k5vfwl1j) - Used because primary is out of bandwidth
const imagekit = safeInit(
    process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_PUBLIC_KEY,
    process.env.SECONDARY_IMAGEKIT_PRIVATE_KEY,
    process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_URL_ENDPOINT
) || safeInit(
    process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
    process.env.IMAGEKIT_PRIVATE_KEY,
    process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT
) || new ImageKit({
    publicKey: "placeholder",
    privateKey: "placeholder",
    urlEndpoint: "https://ik.imagekit.io/placeholder"
});

// Helper to optimize ImageKit URLs with transformations (aggressive bandwidth savings)
export function optimizeImageUrl(url: string | null | undefined, options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'auto';
} = {}): string {
    // Return fallback if no URL or not an ImageKit URL
    if (!url || !url.includes('imagekit.io')) {
        return url || "https://images.unsplash.com/photo-1552066344-24632e509613?q=80&w=1000&auto=format&fit=crop";
    }

    // Build transformation string with aggressive optimization defaults
    const transformations = [];
    if (options.width) transformations.push(`w-${options.width}`);
    if (options.height) transformations.push(`h-${options.height}`);

    // Default to quality 75 for significant bandwidth savings
    const quality = options.quality !== undefined ? options.quality : 75;
    transformations.push(`q-${quality}`);

    // Default to 'auto' format which serves AVIF to supported browsers, then WebP
    const format = options.format || 'auto';
    transformations.push(`f-${format}`);

    const tr = transformations.join(',');

    // Insert transformation after the endpoint
    // Example: https://ik.imagekit.io/6k5vfwl1j/products/image.jpg -> https://ik.imagekit.io/6k5vfwl1j/tr:w-400/products/image.jpg
    const endpoint = process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_URL_ENDPOINT || process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

    if (endpoint && url.startsWith(endpoint)) {
        const path = url.replace(endpoint, '');
        return `${endpoint}/tr:${tr}${path}`;
    }

    // Fallback if endpoint doesn't match
    const parts = url.split('/');
    const domain = parts.slice(0, 4).join('/'); // https://ik.imagekit.io/endpoint
    const rest = '/' + parts.slice(4).join('/');
    return `${domain}/tr:${tr}${rest}`;
}

export default imagekit;
