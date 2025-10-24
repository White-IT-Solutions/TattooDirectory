/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use standalone for local Docker, export for AWS deployment
  output: process.env.NEXT_PUBLIC_ENVIRONMENT === 'local' ? 'standalone' : 'export',
  
  // Only add trailingSlash for static export (AWS)
  ...(process.env.NEXT_PUBLIC_ENVIRONMENT !== 'local' && { trailingSlash: true }),
  
  eslint: {
    // Disable ESLint during builds for production
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript errors during builds
    ignoreBuildErrors: true,
  },
  // Production optimizations
  experimental: {
    // Future Next.js features can be enabled here
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "4566",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },
      {
        protocol: "https",
        hostname: "cdn.jsdelivr.net",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "i.pinimg.com",
      },
      {
        protocol: "https",
        hostname: "loremflickr.com",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
    ],
    formats: ["image/webp", "image/avif"],
    // Unoptimized for static export OR development
    unoptimized: process.env.NEXT_PUBLIC_ENVIRONMENT !== 'local' || process.env.NODE_ENV === 'development',
  },
  env: {
    NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  },
  productionBrowserSourceMaps: false,
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

export default nextConfig;