/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  output: 'standalone',
  distDir: '.next',
  outputFileTracingRoot: path.join(__dirname, '../'),
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'd3bfv5x1dw8ekm.cloudfront.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'd21bqxhdty55n7.cloudfront.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'stagingimage.technoheaven.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'stagingimage.gujjutours.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'stagingapi.gujjutours.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'stagingapi.tripgoasia.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'stagingapi.technoheaven.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '5000',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
