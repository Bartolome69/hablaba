import { PostHog } from "posthog-node"

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY

// flushAt:1 ensures events are sent before the serverless function exits
export const posthog = key
  ? new PostHog(key, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0,
    })
  : null
