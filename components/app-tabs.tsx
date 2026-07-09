"use client"

// Top-level tab navigation shared by the main app (AppHeader) and the Criar
// module home. The Criar tab is gated by the `criar_enabled` localStorage
// flag: unlocked by long-pressing the Hablaba wordmark (see AppHeader) or by
// visiting /criar directly (the seed sets it).

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { usePostHog } from "posthog-js/react"

export const CRIAR_FLAG = "criar_enabled"

export function isCriarEnabled(): boolean {
  try {
    return localStorage.getItem(CRIAR_FLAG) === "1"
  } catch {
    return false
  }
}

export function AppTabs() {
  const pathname = usePathname()
  const router = useRouter()
  const posthog = usePostHog()
  const [criarEnabled, setCriarEnabled] = useState(false)

  // localStorage is client-only — read after mount to avoid hydration mismatch
  useEffect(() => {
    setCriarEnabled(isCriarEnabled())
  }, [])

  const tabs = [
    { id: "speak", label: "Speak", href: "/app/speak", active: pathname === "/app/speak" },
    { id: "practice", label: "Practice", href: "/app/practice", active: pathname === "/app/practice" },
    ...(criarEnabled
      ? [{ id: "criar", label: "Criar", href: "/criar", active: pathname.startsWith("/criar") }]
      : []),
  ]

  return (
    <nav className="flex w-full border-b border-border">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => {
            posthog.capture("tab_switched", { tab: tab.id })
            router.push(tab.href)
          }}
          className={`-mb-px flex-1 border-b-2 px-2 pb-2.5 pt-1 text-center text-sm font-medium transition-colors ${
            tab.active
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
