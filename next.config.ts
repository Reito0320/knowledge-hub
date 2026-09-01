import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname:
          'knowledge-hub-s3-810626480458-ap-northeast-1-an.s3.ap-northeast-1.amazonaws.com',
        port: '',
        pathname: '/profile-images/**',
      },
    ],
  },
};

export default nextConfig;
