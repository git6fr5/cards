import type { NextConfig } from "next";

// Same-origin API proxy: browser talks to /api/* and Next forwards to the backend
// server-side, so the session cookie is set on the frontend origin (Secure +
// SameSite=Lax both satisfied) rather than the cross-scheme http backend.
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN ?? 'http://localhost:8000';

const nextConfig: NextConfig = {
  // For the test-video page: allows the phone's LAN-origin HMR websocket request through
  // in dev. Remove alongside the rest of test-video when that's deleted.
  allowedDevOrigins: ['172.31.21.137'],
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${BACKEND_ORIGIN}/:path*` },
    ];
  },
};

export default nextConfig;
