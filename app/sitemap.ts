import type { MetadataRoute } from "next"
import { audienceSlugs } from "@/lib/marketing/audiences"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://spanishroutine.com"

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    ...audienceSlugs.map((slug) => ({
      url: `${SITE_URL}/for/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ]
}
