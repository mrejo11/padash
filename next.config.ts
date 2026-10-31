import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  serverExternalPackages: ["@netlify/blobs"],
  env: {
    // This is a public namespace, never a credential. Keep preview data separate.
    PADASH_STORE_NAMESPACE: process.env.PADASH_STORE_NAMESPACE || "local",
  },
};

export default nextConfig;
