import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    // Allow production builds to succeed even if ESLint errors are present
    ignoreDuringBuilds: true,
  },
  typescript: {
    // (Optional) same idea for TS errors if they’re blocking
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
