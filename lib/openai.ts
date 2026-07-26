import OpenAI from "openai"

let client: OpenAI | null = null

/**
 * Lazily construct the shared OpenAI client.
 *
 * The OpenAI SDK throws in its constructor when `OPENAI_API_KEY` is missing.
 * Constructing at module scope therefore makes the key a *build-time*
 * dependency: Next.js evaluates each route module during page-data collection,
 * so a build without the key set (e.g. a Vercel deploy) fails before any
 * request is ever served. Deferring construction to the first request keeps the
 * key a runtime-only concern.
 */
export function getOpenAI(): OpenAI {
  return (client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY }))
}
