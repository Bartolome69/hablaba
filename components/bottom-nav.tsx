"use client"

// App-level primary navigation: a persistent bottom tab bar shared by the main
// app and the Grow module. Replaces the old top underline tabs (AppTabs). The
// Grow tab is gated by the `criar_enabled` flag. The bar hides on full-screen
// detail views (chat, sparring) so those keep their own focused chrome.

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { BookOpen, MessageSquare, Sprout } from "lucide-react"
import { usePostHog } from "posthog-js/react"
import { CRIAR_FLAG_EVENT, isCriarEnabled } from "@/lib/criar-flag"

const HIDE_ON = ["/app/chat", "/grow/sparring"]

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const posthog = usePostHog()
  const [criarEnabled, setCriarEnabled] = useState(false)

  // localStorage is client-only — read after mount to avoid hydration mismatch,
  // and keep in sync when the Grow toggle flips (Settings) or another tab changes it.
  useEffect(() => {
    const sync = () => setCriarEnabled(isCriarEnabled())
    sync()
    window.addEventListener(CRIAR_FLAG_EVENT, sync)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener(CRIAR_FLAG_EVENT, sync)
      window.removeEventListener("storage", sync)
    }
  }, [])

  if (HIDE_ON.some((p) => pathname.startsWith(p))) return null

  const tabs = [
    { id: "speak", label: "Phrases", href: "/app/speak", icon: BookOpen, active: pathname === "/app/speak" },
    { id: "practice", label: "Practice", href: "/app/practice", icon: MessageSquare, active: pathname === "/app/practice" },
    ...(criarEnabled
      ? [{ id: "criar", label: "Grow", href: "/grow", icon: Sprout, active: pathname.startsWith("/grow") }]
      : []),
  ]

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur">
      <div
        className="mx-auto flex max-w-lg items-stretch"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => {
                posthog.capture("tab_switched", { tab: tab.id })
                router.push(tab.href)
              }}
              aria-current={tab.active ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors active:scale-[0.97] ${
                tab.active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`h-5 w-5 ${tab.active ? "fill-primary/15" : ""}`} strokeWidth={tab.active ? 2.2 : 1.9} />
              {tab.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
