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
                // Allow Harishblog admin portal to embed the admin login page in an iframe
                source: '/admin/login',
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
