/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable static export for local development
  output: undefined,
  trailingSlash: true,
  
  // Enable hot reloading in Docker with enhanced debugging support
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
      // Enhanced source maps for debugging
      config.devtool = 'eval-source-map';
      
      // Ensure source maps are generated for all modules
      config.module.rules.push({
        test: /\.(js|jsx|ts|tsx)$/,
        use: {
          loader: 'source-map-loader',
        },
        enforce: 'pre',
      });
    }
    return config;
  },
  
  images: {
    // Disable image optimization for local development
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
  
  // Environment-specific configuration for Docker
  env: {
    NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT || 'local',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  },
  
  // Enable experimental features for better Docker performance
  experimental: {
    // Reduce memory usage
    workerThreads: false,
    cpus: 1,
  },
};

export default nextConfig;