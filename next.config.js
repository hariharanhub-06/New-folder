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
                    // SAMEORIGIN here — CSP frame-ancestors overrides this in all modern browsers,
                    // allowing hariharanhub.com admin portal to embed these pages via iframe
                    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'X-XSS-Protection', value: '1; mode=block' },
                    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
                    {
                        key: 'Content-Security-Policy',
                        value: [
                            "default-src 'self'",
                            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com",
                            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                            "img-src 'self' data: blob: https: http:",
                            "font-src 'self' data: https://fonts.gstatic.com",
                            "connect-src 'self' https: wss:",
                            "media-src 'self' https: blob:",
                            "frame-src https://*.razorpay.com https://www.google.com https://maps.google.com",
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
