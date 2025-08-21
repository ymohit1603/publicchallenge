import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable ESLint during build for faster deployment (ESLint runs separately)
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disable TypeScript build errors for deployment (run type checking separately)
  typescript: {
    ignoreBuildErrors: false, // Keep this false to catch actual type errors
  },
  
  // Optimize for production
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com', // Twitter avatars
      },
      {
        protocol: 'https',
        hostname: 'abs.twimg.com', // Twitter avatars
      }
    ],
  },
};

export default nextConfig;
