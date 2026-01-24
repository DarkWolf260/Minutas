/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,

  typescript: {
    // Remove ignoreBuildErrors for better type safety
    // ignoreBuildErrors: false,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // Performance optimizations
  poweredByHeader: false,
  compress: true,
};

module.exports = nextConfig;
