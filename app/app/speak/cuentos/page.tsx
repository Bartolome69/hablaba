import { Suspense } from "react"
import type { Metadata } from "next"
import { CuentosApp } from "@/components/cuentos/cuentos-app"

// Cuentos: picture books photographed by the parent, read aloud in Spanish.
// One static page; the view comes from the query string (lib/cuentos/nav.ts)
// so the whole shelf works offline. See docs/cuentos-plan.md.

export const metadata: Metadata = {
  title: "Cuentos",
  robots: { index: false },
}

export default function CuentosPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-background" />}>
      <CuentosApp />
    </Suspense>
  )
}
