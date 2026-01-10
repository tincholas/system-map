import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  /* config options here */
  // Only use static export in production/build mode. 
  // In Dev, we need normal mode for Keystatic/Dynamic routes to work.
  output: isDev ? undefined : 'export',

  // Required for static export to work with images if using default loader
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
