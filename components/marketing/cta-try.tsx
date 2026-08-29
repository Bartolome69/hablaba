"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { usePostHog } from "posthog-js/react"

interface CtaTryProps {
  audience?: string
  placement?: string
  variant?: "solid" | "ghost"
  children?: React.ReactNode
  className?: string
}

export function CtaTry({ audience, placement = "hero", variant = "solid", children, className }: CtaTryProps) {
  const pathname = usePathname()
  const posthog = usePostHog()

  const styles =
    variant === "solid"
      ? "clay-green h-12 px-7 text-cream"
      : "press-chip h-11 px-4 text-green hover:underline underline-offset-4"

  return (
    <Link
      href="/app/today"
      onClick={() => posthog?.capture("try_app_clicked", { source: pathname, audience, placement })}
      className={`inline-flex items-center justify-center rounded-full text-[15px] font-semibold ${styles} ${className ?? ""}`}
    >
      {children ?? "Try it free"}
    </Link>
  )
}
