/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enables the new Next.js 16 proxy-based auth model
    authInterrupts: true,
    staleTimes: { dynamic: 0 },
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
