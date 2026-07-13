import type { Metadata } from "next"
import { BottomNav } from "@/components/bottom-nav"

export const metadata: Metadata = {
  title: "Grow",
  robots: { index: false, follow: false },
}

export default function CriarLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-lg">
      {children}
      <BottomNav />
    </div>
  )
}
