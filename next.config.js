/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        loader: 'custom',
        loaderFile: './lib/imageLoader.ts',
    },
    experimental: {
        serverComponentsExternalPackages: [],
    },
    async headers() {
        return [
            {
                // Allow Harishblog admin portal to embed any page in an iframe
                source: '/:path*',
                headers: [
                    {
                        key: 'Content-Security-Policy',
                        value: "frame-ancestors 'self' https://hariharanhub.com",
                    },
                ],
            },
        ];
    },
};

module.exports = nextConfig;
