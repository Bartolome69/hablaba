import type { Metadata } from "next"
import { CriarNav } from "@/components/criar/criar-nav"

export const metadata: Metadata = {
  title: "Criar",
  robots: { index: false, follow: false },
  manifest: "/criar/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Criar", statusBarStyle: "default" },
  icons: {
    // keep the root favicons, but give the Criar PWA its own home-screen icon
    icon: [
      { url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark-32x32.png", media: "(prefers-color-scheme: dark)" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/criar/apple-icon",
  },
}

export default function CriarLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-lg">
      {children}
      <CriarNav />
    </div>
  )
}
