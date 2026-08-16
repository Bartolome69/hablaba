"use client"

// Secondary navigation within the Grow module (Today / Sparring / Journal),
// shown as a segmented control at the top of the Grow screens. The app-level
// destinations (Speak / Practice / Grow) live in the bottom tab bar; this sits
// one level down. Sparring is a full-screen conversation, so it isn't rendered
// there — tapping it navigates into that focused view.

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { isVoiceEnabled } from "@/lib/criar/voice/config"

const items = [
  { href: "/grow", label: "Today" },
  { href: "/grow/sparring", label: "Catch up" },
  { href: "/grow/journal", label: "Journal" },
] as const

// Voice mode is unlinked while it's being dogfooded: reachable at /grow/voice
// by URL, but only shown here once `criar_voice_enabled` is set.
const voiceItem = { href: "/grow/voice", label: "Charlar" } as const

export function GrowSectionNav({ className = "mb-6" }: { className?: string }) {
  const pathname = usePathname()
  const [voiceEnabled, setVoiceEnabled] = useState(false)

  // localStorage is client-only — read after mount to avoid a hydration mismatch.
  useEffect(() => setVoiceEnabled(isVoiceEnabled()), [])

  const visible = voiceEnabled ? [...items, voiceItem] : items

  return (
    <div className={cn("flex gap-1 rounded-full bg-secondary p-1", className)}>
      {visible.map(({ href, label }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex-1 rounded-full py-2 text-center text-sm font-medium transition-colors ${
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}
