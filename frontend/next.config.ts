import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/institution/:path*',
        destination: '/academician',
        permanent: false,
      },
      {
        source: '/institution',
        destination: '/academician',
        permanent: false,
      },
    ]
  },
};

export default nextConfig;
