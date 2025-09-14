/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure workspace root to fix lockfile warning
  outputFileTracingRoot: process.env.NODE_ENV === 'development' ? '../' : undefined,
  
  // Enable static export for S3 deployment (disabled in development)
  output: process.env.NODE_ENV === 'development' ? undefined : 'export',
  trailingSlash: process.env.NODE_ENV === 'development' ? false : true,
  
  images: {
    // Disable image optimization for static export
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.jsdelivr.net",
      },
      {
        protocol: "https",
        hostname: "i.pinimg.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "loremflickr.com",
      },
    ],
  },
  
  // Environment-specific configuration
  env: {
    NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_API_URL_DEV: process.env.NEXT_PUBLIC_API_URL_DEV,
    NEXT_PUBLIC_API_URL_PROD: process.env.NEXT_PUBLIC_API_URL_PROD,
  },
  
  webpack: (config, { dev }) => {
    if (dev) {
      config.devtool = 'source-map';
    } else {
      config.devtool = false;
    }
    return config;
  },
};

export default nextConfig;
