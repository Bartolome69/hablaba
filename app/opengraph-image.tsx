import { ImageResponse } from "next/og"

export const alt = "Hablaba — Spanish for daily life"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// Clay + calm: cream ground, forest ink, one terracotta accent.
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
          background: "#f8f3eb",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: 36, color: "#1b5a2e", letterSpacing: -0.5 }}>Hablaba</div>
          <div
            style={{
              fontSize: 22,
              color: "#8a9188",
              letterSpacing: 4,
              textTransform: "uppercase",
            }}
          >
            Spanish for daily life
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 88, lineHeight: 1.05, color: "#1e3d2c", letterSpacing: -2 }}>
            Speak Spanish with your little one.
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 46, height: 6, background: "#c4633e", borderRadius: 3 }} />
            <div style={{ fontSize: 32, color: "#6e7a6f" }}>Warm, calm, encouraging.</div>
          </div>
        </div>
      </div>
    ),
    size,
  )
}
