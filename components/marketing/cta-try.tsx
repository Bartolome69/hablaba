"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { usePostHog } from "posthog-js/react"
import { Button } from "@/components/ui/button"

interface CtaTryProps {
  audience?: string
  placement?: string
  variant?: "default" | "outline" | "ghost"
  children?: React.ReactNode
  className?: string
}

export function CtaTry({ audience, placement = "hero", variant = "outline", children, className }: CtaTryProps) {
  const pathname = usePathname()
  const posthog = usePostHog()

  return (
    <Button asChild variant={variant} size="lg" className={`rounded-full ${className ?? ""}`}>
      <Link
        href="/app/practice"
        onClick={() =>
          posthog?.capture("try_app_clicked", { source: pathname, audience, placement })
        }
      >
        {children ?? "Try it free"}
      </Link>
    </Button>
  )
}
