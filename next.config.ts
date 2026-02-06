import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Avatar Google
      },
      {
        protocol: 'https',
        hostname: 'cdn.myanimelist.net', // Images Jikan API
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // Bannières par défaut
      },
      // Ajoute ici ton domaine Supabase si tu stockes des avatars customs
      {
        protocol: 'https',
        hostname: '**.supabase.co', 
      }
    ],
  },
};

export default nextConfig;