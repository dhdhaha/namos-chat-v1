import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'drifsxbtlkulgapaokno.supabase.co', // Supabase 도메인 추가
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;