import { ImageResponse } from "next/og"

// Distinct home-screen icon for the Criar PWA install (iOS reads this
// segment-level apple-touch-icon, not the manifest icons).

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#35603a",
          color: "#f5efe6",
          fontSize: 104,
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        C
      </div>
    ),
    size,
  )
}
