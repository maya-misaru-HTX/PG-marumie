import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Increase body size limit for API routes (for PDF uploads up to 20MB)
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
};

export default nextConfig;
