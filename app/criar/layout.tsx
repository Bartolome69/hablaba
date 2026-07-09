import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Criar",
  robots: { index: false, follow: false },
}

export default function CriarLayout({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-lg">{children}</div>
}
