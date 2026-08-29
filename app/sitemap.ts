import type { MetadataRoute } from "next"
import { audienceSlugs } from "@/lib/marketing/audiences"
import { coveredTopics } from "@/lib/exercises/content"
import { phrasePages } from "@/lib/marketing/phrase-pages"
import { routines } from "@/lib/routines"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://spanishroutine.com"

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const entry = (
    path: string,
    priority: number,
    changeFrequency: "weekly" | "monthly" = "weekly",
  ) => ({ url: `${SITE_URL}${path}`, lastModified: now, changeFrequency, priority })

  return [
    entry("/", 1),
    ...audienceSlugs.map((slug) => entry(`/for/${slug}`, 0.8)),
    entry("/gramatica", 0.9),
    ...coveredTopics().map((c) => entry(`/gramatica/${c.topic.id}`, 0.7, "monthly")),
    entry("/frases", 0.9),
    ...routines.filter((r) => phrasePages[r.id]).map((r) => entry(`/frases/${r.id}`, 0.7, "monthly")),
  ]
}
