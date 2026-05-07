"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { usePostHog } from "posthog-js/react"
import { Button } from "@/components/ui/button"

export function MarketingNav() {
  const pathname = usePathname()
  const posthog = usePostHog()

  return (
    <nav className="w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="font-serif text-xl font-semibold tracking-tight">
          Hablaba
        </Link>
        <Button asChild size="sm" className="rounded-full">
          <Link
            href="/app/practice"
            onClick={() =>
              posthog?.capture("try_app_clicked", { source: pathname, placement: "nav" })
            }
          >
            Try it free
          </Link>
        </Button>
      </div>
    </nav>
  )
}
