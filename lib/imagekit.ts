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
    // Return fallback if no URL
    if (!url) {
        return "https://images.unsplash.com/photo-1552066344-24632e509613?q=80&w=1000&auto=format&fit=crop";
    }

    // Handle ImageKit (Primary)
    if (url.includes('imagekit.io')) {
        const transformations = [];
        if (options.width) transformations.push(`w-${options.width}`);
        if (options.height) transformations.push(`h-${options.height}`);
        const quality = options.quality !== undefined ? options.quality : 60;
        transformations.push(`q-${quality}`);
        const format = options.format || 'auto';
        transformations.push(`f-${format}`);

        const tr = transformations.join(',');
        const endpoint = process.env.NEXT_PUBLIC_SECONDARY_IMAGEKIT_URL_ENDPOINT || process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

        if (endpoint && url.startsWith(endpoint)) {
            const path = url.replace(endpoint, '');
            return `${endpoint}/tr:${tr}${path}`;
        }

        const parts = url.split('/');
        const domain = parts.slice(0, 4).join('/');
        const rest = '/' + parts.slice(4).join('/');
        return `${domain}/tr:${tr}${rest}`;
    }

    // Handle Cloudinary (Secondary/Fallback)
    if (url.includes('cloudinary.com')) {
        const transformations = [];
        if (options.width) transformations.push(`c_limit,w_${options.width}`);
        if (options.height) transformations.push(`c_limit,h_${options.height}`);
        const quality = options.quality !== undefined ? options.quality : 'auto';
        transformations.push(`q_${quality}`);
        const format = options.format || 'auto';
        transformations.push(`f_${format}`);

        const tr = transformations.join(',');
        if (url.includes('/upload/')) {
            return url.replace('/upload/', `/upload/${tr}/`);
        }
    }

    return url;
}

export default imagekit;
