"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen, MessageCircle, Sun } from "lucide-react"

const items = [
  { href: "/grow", label: "Today", icon: Sun },
  { href: "/grow/sparring", label: "Sparring", icon: MessageCircle },
  { href: "/grow/journal", label: "Journal", icon: BookOpen },
] as const

export function CriarNav() {
  const pathname = usePathname()
  // Sparring is a full-screen chat with its own input bar — no nav there
  if (pathname.startsWith("/grow/sparring")) return null

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background">
      <div
        className="mx-auto flex max-w-lg items-stretch"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs transition-colors ${
                active ? "font-medium text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
