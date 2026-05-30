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
                source: '/:path*',
                headers: [
                    // X-Frame-Options intentionally omitted — CSP frame-ancestors handles iframe
                    // allowance for hariharanhub.com admin portal (X-Frame-Options: DENY would break it)
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'X-XSS-Protection', value: '1; mode=block' },
                    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
                    {
                        key: 'Content-Security-Policy',
                        value: [
                            "default-src 'self'",
                            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
                            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                            "img-src 'self' data: blob: https: http:",
                            "font-src 'self' data: https://fonts.gstatic.com",
                            "connect-src 'self' https: wss:",
                            "media-src 'self' https: blob:",
                            "frame-ancestors 'self' https://hariharanhub.com",
                            "object-src 'none'",
                        ].join('; '),
                    },
                ],
            },
        ];
    },
};

module.exports = nextConfig;
