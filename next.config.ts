import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
        ],
      },
      {
        // Pages get a per-request nonce CSP from proxy.ts; API responses keep this one.
        source: "/api/:path*",
        headers: [{ key: "Content-Security-Policy", value: "frame-ancestors 'none'" }],
      },
    ];
  },
  outputFileTracingIncludes: {
    "/api/contracts/[id]/pdf": ["./lib/pdf/fonts/*.ttf"],
    "/api/contracts/[id]/recipient-sign": ["./lib/pdf/fonts/*.ttf"],
  },
};

export default nextConfig;
