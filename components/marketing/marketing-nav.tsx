"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { usePostHog } from "posthog-js/react"

export function MarketingNav() {
  const pathname = usePathname()
  const posthog = usePostHog()

  const links = [
    { href: "/gramatica", label: "Grammar" },
    { href: "/frases", label: "Phrases" },
  ]

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-rule bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <Link href="/" className="font-serif text-[22px] tracking-[-0.02em] text-green">
          Hablaba
        </Link>
        <div className="flex items-center gap-1 sm:gap-4">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                pathname.startsWith(l.href) ? "text-green" : "text-ink-muted hover:text-ink"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/#waitlist"
            onClick={() => posthog?.capture("waitlist_cta_clicked", { source: pathname, placement: "nav" })}
            className="clay-green ml-1 inline-flex h-10 items-center whitespace-nowrap rounded-full px-5 text-sm font-semibold text-cream"
          >
            Join waitlist
          </Link>
        </div>
      </div>
    </nav>
  )
}
