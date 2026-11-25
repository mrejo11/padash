import type { NextConfig } from "next";
import { isPreviewDeployment, SITE_URL } from "./lib/site-config";

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
    const publicPaths = ['/', '/products/:path*', '/guides/:path*', '/calculator', '/news/:path*', '/about', '/contact', '/privacy', '/quote-terms', '/thermal-insulation', '/cold-insulation', '/sound-insulation', '/robots.txt', '/sitemap.xml'];
    const canonicalHost = new URL(SITE_URL).hostname;
    const hostAlias = canonicalHost.startsWith('www.') ? canonicalHost.slice(4) : 'www.' + canonicalHost;
    const aliases = [hostAlias, 'padash-five.vercel.app'].filter(host => host !== canonicalHost)
      .flatMap(host => publicPaths.flatMap(destination => (destination === '/' ? ['/'] : [destination + '/', destination])
        .map(source => ({
          source, has: [{type: 'host' as const, value: host.replaceAll('.', '\\.')}],
          destination: SITE_URL + destination, statusCode: 301,
        }))));
    return [...aliases, {source: '/:path+/', destination: '/:path+', permanent: true}];
  },
  async headers() {
    return [
      ...(isPreviewDeployment() ? [{ source: '/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }] : []),
      { source: '/management/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }, { key: 'Cache-Control', value: 'private, no-store' }] },
      { source: '/request/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }, { key: 'Referrer-Policy', value: 'no-referrer' }, { key: 'Cache-Control', value: 'private, no-store' }] },
      { source: '/api/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
    ];
  },
  env: {
    // This is a public namespace, never a credential. Keep preview data separate.
    PADASH_STORE_NAMESPACE: process.env.PADASH_STORE_NAMESPACE || "local",
  },
};

export default nextConfig;
