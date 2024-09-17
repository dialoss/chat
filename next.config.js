/** @type {import('next').NextConfig} */
const path = require('path');
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
},
typescript: {
    ignoreBuildErrors: true
},
reactStrictMode: false,
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
    };
    return config
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self'",
          },
        ],
      },
    ]
  },
  experimental: {
    serviceWorker: true,
  },
}

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
});

module.exports = nextConfig
// module.exports = withPWA(nextConfig)
