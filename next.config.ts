import type { NextConfig } from 'next';

const s3BucketName = process.env.S3_BUCKET_NAME;
const s3Region = process.env.S3_REGION;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      ...(s3BucketName && s3Region
        ? [
            {
              protocol: 'https' as const,
              hostname: `${s3BucketName}.s3.${s3Region}.amazonaws.com`,
              port: '',
              pathname: '/profile-images/**',
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
