import { PostHog } from "posthog-node"

// flushAt:1 ensures events are sent before the serverless function exits
export const posthog = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  flushAt: 1,
  flushInterval: 0,
})
