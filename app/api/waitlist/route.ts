import { NextResponse } from "next/server"
import { posthog } from "@/lib/posthog-server"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: Request) {
  let body: { email?: string; source?: string; audience?: string; placement?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const email = body.email?.trim().toLowerCase()
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 })
  }

  const apiKey = process.env.RESEND_API_KEY
  const audienceId = process.env.RESEND_AUDIENCE_ID

  if (apiKey && audienceId) {
    const res = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        unsubscribed: false,
        first_name: body.audience ?? body.source ?? undefined,
      }),
    })
    if (!res.ok && res.status !== 409) {
      const detail = await res.text().catch(() => "")
      console.error("[waitlist] resend error", res.status, detail)
      return NextResponse.json({ error: "Could not save email" }, { status: 502 })
    }
  } else {
    console.log("[waitlist] signup (no Resend configured)", { email, source: body.source, audience: body.audience })
  }

  if (posthog) {
    try {
      posthog.capture({
        distinctId: email,
        event: "waitlist_signup",
        properties: {
          source: body.source,
          audience: body.audience,
          placement: body.placement,
        },
      })
      await posthog.flush()
    } catch (err) {
      console.error("[waitlist] posthog error", err)
    }
  }

  return NextResponse.json({ ok: true })
}
