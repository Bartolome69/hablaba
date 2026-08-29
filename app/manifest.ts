import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hablaba — Spanish for daily life",
    short_name: "Hablaba",
    description:
      "Practice conversational Spanish with an AI tutor. Warm, calm, encouraging — for parents and B1 learners.",
    start_url: "/app/today",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f8f3eb",
    theme_color: "#f8f3eb",
    categories: ["education", "lifestyle"],
    lang: "en",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      // "any maskable" combined entries are invalid per the manifest spec —
      // each purpose gets its own entry so both keep working.
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png", purpose: "any" },
    ],
  }
}
