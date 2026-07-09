// Criar installs as its own PWA, separate from the Hablaba app icon.
// Next.js only supports one app/manifest.ts, so this route serves a second
// manifest that app/criar/layout.tsx links via metadata.

export function GET() {
  return Response.json(
    {
      name: "Criar — Rioplatense for Teo",
      short_name: "Criar",
      description:
        "Daily Rioplatense Spanish for raising Teo bilingually: phrase packs, captures, sparring.",
      start_url: "/criar",
      scope: "/criar",
      display: "standalone",
      orientation: "portrait",
      background_color: "#f5efe6",
      theme_color: "#f5efe6",
      lang: "es",
      icons: [
        { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      ],
    },
    { headers: { "Content-Type": "application/manifest+json" } },
  )
}
