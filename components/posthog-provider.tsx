"use client"

import posthog from "posthog-js"
import { PostHogProvider as PHProvider } from "posthog-js/react"
import { usePathname, useSearchParams } from "next/navigation"
import { Suspense, useEffect } from "react"

function PageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Cuentos URLs carry book ids in the query string; send the path only
    // (docs/cuentos-plan.md, question 6: no Cuentos analytics beyond a pageview).
    const keepQuery = searchParams.toString() && !pathname.startsWith("/app/speak/cuentos")
    const url = window.origin + pathname + (keepQuery ? `?${searchParams}` : "")
    posthog.capture("$pageview", { $current_url: url })
  }, [pathname, searchParams])

  return null
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      person_profiles: "always",
      capture_pageview: false,
      capture_pageleave: true,
      // Every event carries the page URL; on Cuentos that would include book
      // ids. Keep the path, drop the query, on every event (pageleave too).
      before_send: (event) => {
        const props = event?.properties
        if (props) {
          for (const key of ["$current_url", "$referrer"]) {
            const value = props[key]
            if (typeof value === "string" && value.includes("/app/speak/cuentos")) props[key] = value.split("?")[0]
          }
        }
        return event
      },
    })
  }, [])

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PageView />
      </Suspense>
      {children}
    </PHProvider>
  )
}
