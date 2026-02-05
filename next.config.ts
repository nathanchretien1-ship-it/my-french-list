// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Pour Google Auth
      },
      {
        protocol: 'https',
        hostname: 'cdn.myanimelist.net', // Pour Jikan API
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co', // Pour ton stockage Supabase
      }
    ],
  },
};

export default nextConfig;