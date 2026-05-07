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
          background: "#f5efe6",
          fontFamily: "serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 36, color: "#7a6a4f", letterSpacing: -0.5 }}>Hablaba</div>
          <div
            style={{
              fontSize: 22,
              color: "#7a6a4f",
              textTransform: "uppercase",
              letterSpacing: 2,
              border: "2px solid #d4c4a8",
              borderRadius: 999,
              padding: "8px 20px",
            }}
          >
            {eyebrow}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 76, lineHeight: 1.05, color: "#1f1a13", letterSpacing: -2 }}>
            {headline}
          </div>
        </div>
      </div>
    ),
    size,
  )
}
