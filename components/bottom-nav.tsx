"use client"

// App-level primary navigation: a persistent bottom tab bar. Hides on
// full-screen conversation views, which keep their own focused chrome.

import { usePathname, useRouter } from "next/navigation"
import { BookOpen, Dumbbell, MessagesSquare, Sun } from "lucide-react"
import { usePostHog } from "posthog-js/react"

// Full-screen conversation views keep their own chrome. The Charlar HUB keeps
// the bar (it's a top-level destination); only a conversation itself hides it.
const HIDE_ON = ["/app/chat", "/app/charla/"]

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const posthog = usePostHog()

  if (HIDE_ON.some((p) => pathname.startsWith(p))) return null

  const tabs = [
    { id: "today", label: "Today", href: "/app/today", icon: Sun, active: pathname === "/app/today" },
    { id: "charla", label: "Charlar", href: "/app/charla", icon: MessagesSquare, active: pathname.startsWith("/app/charla") },
    { id: "speak", label: "Phrases", href: "/app/speak", icon: BookOpen, active: pathname === "/app/speak" },
    { id: "exercises", label: "Exercises", href: "/app/exercises", icon: Dumbbell, active: pathname.startsWith("/app/exercises") },
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
