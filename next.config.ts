import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  serverExternalPackages: ["@netlify/blobs"],
  async headers() {
    return [
      { source: '/management/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }, { key: 'Cache-Control', value: 'private, no-store' }] },
      { source: '/request/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }, { key: 'Referrer-Policy', value: 'no-referrer' }] },
      { source: '/api/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
    ];
  },
  env: {
    // This is a public namespace, never a credential. Keep preview data separate.
    PADASH_STORE_NAMESPACE: process.env.PADASH_STORE_NAMESPACE || "local",
  },
};

export default nextConfig;
