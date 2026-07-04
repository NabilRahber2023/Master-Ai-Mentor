import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

// `BACKEND_URL` is baked into the rewrite rules at build time. In development we
// fall back to the local backend, but for a production BUILD we FAIL LOUDLY when
// it is missing instead of silently proxying /api/v1/* to localhost:8001 (which
// would break the deployed app in a hard-to-diagnose way). The check is scoped to
// the production-build phase so it never blocks `next start` or `next dev`.
export default function nextConfigFactory(phase: string): NextConfig {
  if (phase === PHASE_PRODUCTION_BUILD && !process.env.BACKEND_URL) {
    throw new Error(
      "BACKEND_URL is required for a production build. Pass it as a build arg/env " +
        "so /api/v1/* is rewritten to your backend (e.g. BACKEND_URL=http://api:8000).",
    );
  }

  const backendUrl = process.env.BACKEND_URL || "http://localhost:8001";

  return {
    reactCompiler: true,
    // Type checking runs locally in VS Code during development; the 1GB
    // production server OOMs during `next build`'s TS check, so skip it there.
    typescript: { ignoreBuildErrors: true },
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
}
