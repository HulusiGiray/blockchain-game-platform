import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js will automatically detect the src directory
  eslint: {
    // Production build sırasında ESLint hatalarını görmezden gel
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Production build sırasında TypeScript hatalarını görmezden gel
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
