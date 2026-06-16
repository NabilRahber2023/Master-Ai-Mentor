import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL || "http://localhost:8001";

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    authInterrupts: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
