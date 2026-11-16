import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep local development from generating extra agent instruction files.
  agentRules: false,
  outputFileTracingRoot: process.cwd(),
  serverExternalPackages: ["@netlify/blobs"],
  images: {formats: ['image/avif', 'image/webp']},
  // Canonicalize the host before trimming a trailing slash, avoiding two hops.
  skipTrailingSlashRedirect: true,
  async redirects() {
    // Alias only public routes; management sessions and private receipts stay put.
    const publicPaths = ['/', '/products/:path*', '/guides/:path*', '/calculator', '/news/:path*', '/robots.txt', '/sitemap.xml'];
    const aliases = ['padashgroup.ir', 'padash-five.vercel.app'].flatMap(host => publicPaths.map(source => ({
      source, has: [{type: 'host' as const, value: host}],
      destination: 'https://www.padashgroup.ir' + source, permanent: true,
    })));
    return [...aliases, {source: '/:path+/', destination: '/:path+', permanent: true}];
  },
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
