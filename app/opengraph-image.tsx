import { ImageResponse } from "next/og"

export const alt = "Hablaba — Spanish for daily life"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OGImage() {
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
        <div style={{ fontSize: 36, color: "#7a6a4f", letterSpacing: -0.5 }}>Hablaba</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 88, lineHeight: 1.05, color: "#1f1a13", letterSpacing: -2 }}>
            Speak Spanish with your little one.
          </div>
          <div style={{ fontSize: 32, color: "#5a4f3d" }}>Warm, calm, encouraging.</div>
        </div>
      </div>
    ),
    size,
  )
}
