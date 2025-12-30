/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        loader: 'custom',
        loaderFile: './lib/imageLoader.ts',
    },
    experimental: {
        serverComponentsExternalPackages: [],
    },
};

module.exports = nextConfig;
