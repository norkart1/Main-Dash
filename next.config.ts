import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  distDir: process.env.NODE_ENV === 'development' ? '/tmp/botdash-next' : '.next',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
      },
    ],
  },
  allowedDevOrigins: ['*.pike.replit.dev', '*.replit.dev'],
};

export default nextConfig;
