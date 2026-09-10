import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
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
