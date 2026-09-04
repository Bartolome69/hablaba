"use client"

// App-level primary navigation: a persistent bottom tab bar. Hides on
// full-screen conversation views, which keep their own focused chrome.
//
// Clay + calm: duotone icons over a 10.5px label; the active tab is the only
// full-colour one (green label at 600), inactive tabs sit at .42 opacity.

import { usePathname, useRouter } from "next/navigation"
import { usePostHog } from "posthog-js/react"
import { DuoIcon, type IconName } from "@/components/icons"

// Full-screen conversation views keep their own chrome. The Charlar HUB keeps
// the bar (it's a top-level destination); only a conversation itself hides it.
const HIDE_ON = ["/app/chat", "/app/charla/"]

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const posthog = usePostHog()

  if (HIDE_ON.some((p) => pathname.startsWith(p))) return null

  const tabs: { id: string; label: string; href: string; icon: IconName; active: boolean }[] = [
    { id: "today", label: "Hoy", href: "/app/today", icon: "hoy", active: pathname === "/app/today" },
    { id: "charla", label: "Charlar", href: "/app/charla", icon: "charlar", active: pathname.startsWith("/app/charla") },
    { id: "speak", label: "Frases", href: "/app/speak", icon: "libro", active: pathname === "/app/speak" },
    { id: "palabras", label: "Palabras", href: "/app/palabras", icon: "palabras", active: pathname.startsWith("/app/palabras") },
    { id: "exercises", label: "Práctica", href: "/app/exercises", icon: "practica", active: pathname.startsWith("/app/exercises") },
  ]

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-background">
      <div
        className="mx-auto flex max-w-lg items-start justify-around px-3 pt-3.5"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 14px)" }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              posthog.capture("tab_switched", { tab: tab.id })
              router.push(tab.href)
            }}
            aria-current={tab.active ? "page" : undefined}
            className={`press-chip flex min-w-[52px] flex-col items-center gap-[5px] pb-1 ${
              tab.active ? "text-green" : "text-ink opacity-[.42]"
            }`}
          >
            <DuoIcon name={tab.icon} size={23} detail={tab.active ? undefined : "#1E3D2C"} />
            <span className={`text-[10.5px] leading-none ${tab.active ? "font-semibold" : "font-medium"}`}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  )
}
