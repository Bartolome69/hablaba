import { NextResponse } from "next/server"
import { getOpenAI } from "@/lib/openai"
import { posthog } from "@/lib/posthog-server"

// Tap-to-translate for voice-mode transcripts: one turn of Spanish in,
// natural English out. Stateless; the client caches per turn so a bubble is
// never translated twice. gpt-4o-mini because single-turn es→en needs no
// heavyweight reasoning and this is tapped mid-conversation — latency and
// cost both matter more than nuance here.

export const runtime = "nodejs"
export const maxDuration = 15

const MODEL = "gpt-4o-mini"
const MAX_CHARS = 1200

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { text?: string }
    const text = body.text?.trim()
    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    const response = await getOpenAI().chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "Translate the given Spanish (Rioplatense) into natural, conversational English. Preserve tone and warmth; translate idioms by meaning, not word-for-word. Respond with a JSON object: {\"translation\": \"...\"}",
        },
        { role: "user", content: text.slice(0, MAX_CHARS) },
      ],
      response_format: { type: "json_object" },
    })

    const raw = response.choices[0]?.message?.content
    if (!raw) throw new Error("Empty response from translate model")
    const data = JSON.parse(raw) as { translation?: string }
    if (!data.translation?.trim()) throw new Error("Translation missing")

    posthog?.capture({
      distinctId: "server",
      event: "llm_call",
      properties: {
        type: "voice_turn_translate",
        model: MODEL,
        input_tokens: response.usage?.prompt_tokens ?? null,
        output_tokens: response.usage?.completion_tokens ?? null,
        total_tokens: response.usage?.total_tokens ?? null,
      },
    })

    return NextResponse.json(
      { translation: data.translation.trim() },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch (err) {
    console.error("[/api/translate]", err)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
