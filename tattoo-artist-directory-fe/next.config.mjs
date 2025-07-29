/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    removePatterns: [new URL(`https://cdn.jsdelivr.net/gh/faker-js/**`)],
  },
};

export default nextConfig;
