"use client"

// Secondary navigation within the Grow module (Today / Sparring / Journal /
// Charlar), shown as a segmented control at the top of the Grow screens. The
// app-level destinations (Speak / Practice / Grow) live in the bottom tab bar;
// this sits one level down. Sparring and Charlar are full-screen conversation
// views, so they aren't rendered there — tapping them navigates into that
// focused view.

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const items = [
  { href: "/grow", label: "Today" },
  { href: "/grow/sparring", label: "Catch up" },
  { href: "/grow/voice", label: "Charlar" },
  { href: "/grow/journal", label: "Journal" },
] as const

export function GrowSectionNav({ className = "mb-6" }: { className?: string }) {
  const pathname = usePathname()

  return (
    <div className={cn("flex gap-1 rounded-full bg-secondary p-1", className)}>
      {items.map(({ href, label }) => {
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
