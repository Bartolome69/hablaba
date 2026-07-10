import type { Metadata } from "next"
import { CriarNav } from "@/components/criar/criar-nav"

export const metadata: Metadata = {
  title: "Grow",
  robots: { index: false, follow: false },
}

export default function CriarLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-lg">
      {children}
      <CriarNav />
    </div>
  )
}
