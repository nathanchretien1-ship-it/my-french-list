/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hpqllfgdkwnuwodjgpoe.supabase.co', // Ton Supabase
      },
      {
        protocol: 'https',
        hostname: 'cdn.myanimelist.net', // <--- AJOUTE ÇA
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // Pour les bannières
      },
      { protocol: 'https',
         hostname: 'bit.ly' 
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;