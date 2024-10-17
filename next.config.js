/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['sharp', 'canvas'],
  },
  webpack: (config) => {
    config.externals.push({
      sharp: 'commonjs sharp',
      canvas: 'commonjs canvas',
    });
    // Disable webpack caching
    config.cache = false;
    return config;
  },
  serverRuntimeConfig: {
    api: {
      bodyParser: {
        sizeLimit: '10mb',
      },
      responseLimit: false,
    },
    functionTimeout: process.env.VERCEL_FUNCTIONS_TIMEOUT || 60
  },
  async rewrites() {
    return [
      {
        source: '/api/external/:path*',
        destination: 'http://167.99.227.46:3002/:path*',
      },
    ];
  },
}

module.exports = nextConfig
