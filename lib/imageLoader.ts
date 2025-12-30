'use client';

export default function imageLoader({ src, width, quality }: { src: string, width: number, quality?: number }) {
    if (src.startsWith('http')) {
        // If it's already a full URL (e.g., Unsplash fallback or raw ImageKit)
        // We need to inject transformations efficiently

        // Handle ImageKit
        if (src.includes('imagekit.io')) {
            const params = [`w-${width}`];
            if (quality) {
                params.push(`q-${quality}`);
            } else {
                params.push('q-80'); // Premium Quality
            }
            params.push('f-auto'); // Auto format (AVIF/WebP)

            const paramString = params.join(',');

            // Check if it already has transformation params
            if (src.includes('/tr:')) {
                // Append to existing
                return src.replace('/tr:', `/tr:${paramString},`);
            }

            // Inject before the path
            // Matches: https://ik.imagekit.io/xyz/
            const match = src.match(/(https:\/\/ik\.imagekit\.io\/[^\/]+\/)(.+)/);
            if (match) {
                return `${match[1]}tr:${paramString}/${match[2]}`;
            }
        }
    }

    // Fallback for local or unhandled images
    return src;
}
