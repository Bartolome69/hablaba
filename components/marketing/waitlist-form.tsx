"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { usePostHog } from "posthog-js/react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface WaitlistFormProps {
  audience?: string
  placement?: string
  className?: string
}

export function WaitlistForm({ audience, placement = "hero", className }: WaitlistFormProps) {
  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const pathname = usePathname()
  const posthog = usePostHog()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: pathname, audience, placement }),
      })
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "Something went wrong" }))
        throw new Error(error || "Something went wrong")
      }
      posthog?.capture("waitlist_signup", { source: pathname, audience, placement })
      setDone(true)
      toast.success("You're on the list. ¡Hasta pronto!")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <p className={`text-sm text-muted-foreground ${className ?? ""}`}>
        Thanks — we'll be in touch soon.
      </p>
    )
  }

  return (
    <form onSubmit={onSubmit} className={`flex w-full max-w-md flex-col gap-2 sm:flex-row ${className ?? ""}`}>
      <Input
        type="email"
        required
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="h-11 rounded-full bg-background"
      />
      <Button type="submit" disabled={submitting} className="h-11 rounded-full px-6">
        {submitting ? "Joining…" : "Join waitlist"}
      </Button>
    </form>
  )
}
