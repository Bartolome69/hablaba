import { ImageResponse } from "next/og"
import { audiences } from "@/lib/marketing/audiences"

export const alt = "Hablaba"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OGImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const audience = audiences[slug]
  const headline = audience?.headline ?? "Hablaba — Spanish for daily life"
  const eyebrow = audience?.eyebrow ?? "Spanish for daily life"

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background: "#f8f3eb",
          fontFamily: "serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 36, color: "#1b5a2e", letterSpacing: -0.5 }}>Hablaba</div>
          <div
            style={{
              fontSize: 22,
              color: "#8a4527",
              textTransform: "uppercase",
              letterSpacing: 2,
              background: "#f4dfcc",
              borderRadius: 999,
              padding: "10px 22px",
            }}
          >
            {eyebrow}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 76, lineHeight: 1.05, color: "#1e3d2c", letterSpacing: -2 }}>
            {headline}
          </div>
        </div>
      </div>
    ),
    size,
  )
}
