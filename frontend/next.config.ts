import type { NextConfig } from "next";

import { devOrigins } from './proxy.config';

// Same-origin API proxy: browser talks to /api/* and Next forwards to the backend
// server-side, so the session cookie is set on the frontend origin (Secure +
// SameSite=Lax both satisfied) rather than the cross-scheme http backend.
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN ?? 'http://localhost:8000';

const nextConfig: NextConfig = {
  allowedDevOrigins: devOrigins,
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${BACKEND_ORIGIN}/:path*` },
    ];
  },
};

export default nextConfig;
