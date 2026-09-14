import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/contracts/[id]/pdf": ["./lib/pdf/fonts/*.ttf"],
    "/api/contracts/[id]/recipient-sign": ["./lib/pdf/fonts/*.ttf"],
  },
};

export default nextConfig;
