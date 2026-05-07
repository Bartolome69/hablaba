import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hablaba — Spanish for daily life",
    short_name: "Hablaba",
    description:
      "Practice conversational Spanish with an AI tutor. Warm, calm, encouraging — for parents and B1 learners.",
    start_url: "/app/practice",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f5efe6",
    theme_color: "#f5efe6",
    categories: ["education", "lifestyle"],
    lang: "en",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png", purpose: "any" },
    ],
  }
}
