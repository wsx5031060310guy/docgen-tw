import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://docgen-tw.vercel.app").replace(/\/$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/templates/", "/disclaimer", "/contracts/new"],
        disallow: ["/admin", "/api/", "/cases/", "/contracts/[0-9a-z]*"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
