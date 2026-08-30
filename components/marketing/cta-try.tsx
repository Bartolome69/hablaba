"use client"

// The site's only "try" action: the free on-site exercises. The app itself
// is behind the waitlist, so marketing surfaces never deep-link into /app.

import Link from "next/link"
import { usePathname } from "next/navigation"
import { usePostHog } from "posthog-js/react"

interface CtaExercisesProps {
  audience?: string
  placement?: string
  variant?: "solid" | "ghost"
  children?: React.ReactNode
  className?: string
}

export function CtaExercises({ audience, placement = "hero", variant = "solid", children, className }: CtaExercisesProps) {
  const pathname = usePathname()
  const posthog = usePostHog()

  const styles =
    variant === "solid"
      ? "clay-green h-12 px-7 text-cream"
      : "press-chip h-11 px-4 text-green hover:underline underline-offset-4"

  return (
    <Link
      href="/gramatica"
      onClick={() => posthog?.capture("try_exercises_clicked", { source: pathname, audience, placement })}
      className={`inline-flex items-center justify-center rounded-full text-[15px] font-semibold ${styles} ${className ?? ""}`}
    >
      {children ?? "Try the free exercises"}
    </Link>
  )
}
