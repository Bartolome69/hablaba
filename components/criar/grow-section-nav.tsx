"use client"

// Secondary navigation within the Grow module (Today / Sparring / Journal),
// shown as a segmented control at the top of the Grow screens. The app-level
// destinations (Speak / Practice / Grow) live in the bottom tab bar; this sits
// one level down. Sparring is a full-screen conversation, so it isn't rendered
// there — tapping it navigates into that focused view.

import Link from "next/link"
import { usePathname } from "next/navigation"

const items = [
  { href: "/grow", label: "Today" },
  { href: "/grow/sparring", label: "Sparring" },
  { href: "/grow/journal", label: "Journal" },
] as const

export function GrowSectionNav() {
  const pathname = usePathname()

  return (
    <div className="mb-6 flex gap-1 rounded-full bg-secondary p-1">
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
