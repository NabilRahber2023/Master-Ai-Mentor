import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL || "http://localhost:8001";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Keep the trailing slash on /api/v1/* so it is proxied straight to FastAPI
  // (which expects the slash) without a 308→307 redirect chain that can drop the
  // session cookie in the browser. Fixes intermittent "Authentication required".
  skipTrailingSlashRedirect: true,
  experimental: {
    authInterrupts: true,
  },
  async rewrites() {
    return [
      // Preserve a trailing slash so FastAPI doesn't 307-redirect to its absolute
      // (cross-origin) URL — which would drop the SameSite=Lax session cookie in
      // the browser and cause spurious "Authentication required" errors.
      {
        source: "/api/v1/:path*/",
        destination: `${backendUrl}/api/v1/:path*/`,
      },
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
