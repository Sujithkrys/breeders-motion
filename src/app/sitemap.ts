import type { MetadataRoute } from "next";
import { MOTION_META } from "@/motion/meta.generated";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const newest = MOTION_META.map((m) => m.addedAt).sort().at(-1);
  return [
    { url: SITE.url, lastModified: newest, changeFrequency: "weekly", priority: 1 },
    ...MOTION_META.map((m) => ({
      url: `${SITE.url}/components/${m.slug}`,
      lastModified: m.addedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
