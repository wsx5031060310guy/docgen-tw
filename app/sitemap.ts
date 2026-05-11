import type { MetadataRoute } from "next";
import { TEMPLATES } from "@/lib/templates";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://docgen-tw.vercel.app").replace(/\/$/, "");
  const now = new Date();
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1, lastModified: now },
    { url: `${base}/check`, changeFrequency: "monthly", priority: 0.9, lastModified: now },
    { url: `${base}/contracts/new`, changeFrequency: "monthly", priority: 0.8, lastModified: now },
    { url: `${base}/disclaimer`, changeFrequency: "monthly", priority: 0.7, lastModified: now },
    { url: `${base}/checkout`, changeFrequency: "monthly", priority: 0.6, lastModified: now },
    ...TEMPLATES.map((t) => ({
      url: `${base}/templates/${t.id}`,
      changeFrequency: "monthly" as const,
      priority: 0.85,
      lastModified: now,
    })),
  ];
}
