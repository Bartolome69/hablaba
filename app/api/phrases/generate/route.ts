import { NextResponse } from "next/server"
import { getOpenAI } from "@/lib/openai"
import { posthog } from "@/lib/posthog-server"

// Phrase generation for the unified library. Stateless — the client owns the
// library and decides what to keep. Two jobs, one route:
//
// - moment mode: fill a moment's pack when the library runs short. The daily
//   pack is a QUERY over the library; this is the "generate only to fill gaps"
//   half of that contract.
// - capture mode: the learner hit a gap in real life ("he's got hiccups
//   again") — turn it into the natural phrase, immediately, so a capture
//   becomes a usable Phrase on the spot instead of waiting for tomorrow.

export const runtime = "nodejs"
export const maxDuration = 30

const MODEL = "gpt-4o"

const MOMENT_DESCRIPTIONS: Record<string, string> = {
  baño: "bath time / nappy changes",
  comida: "feeding and meals",
  dormir: "bedtime and naps",
  juego: "play time on the floor",
  paseo: "out on a walk with the pram",
  despertar: "waking up in the morning",
  calmar: "soothing a crying or fussy baby",
}

interface GenerateRequest {
  /** Capture mode: the thing the learner couldn't say, in whatever language it came out. */
  capture?: string
  /** Moment mode: which moment to fill, and how many phrases. */
  moment?: string
  count?: number
  /** Spanish the library already holds — do not duplicate. */
  existing?: string[]
  /** Recent weak spots, so gap-filling leans toward what needs practice. */
  focusAreas?: string[]
  dialect?: "rioplatense" | "neutral"
  childName?: string
}

const DIALECT_BLOCK: Record<string, string> = {
  rioplatense:
    'Vocabulary flavour is Argentine: pañal, chupete, upa, mamadera, cochecito, "dale", "qué lindo". Peninsular words are errors ("vale", "guay", "coger").',
  neutral:
    'Vocabulary flavour is neutral Latin American: clear, widely understood. Peninsular words are errors ("vale", "guay", "coger").',
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as GenerateRequest
    const dialect = body.dialect === "neutral" ? "neutral" : "rioplatense"
    const isCapture = typeof body.capture === "string" && body.capture.trim().length > 0
    const count = isCapture ? 1 : Math.min(Math.max(Number(body.count) || 5, 1), 10)
    const moment = typeof body.moment === "string" ? body.moment : undefined

    if (!isCapture && !moment) {
      return NextResponse.json({ error: "capture or moment is required" }, { status: 400 })
    }

    const existing = (Array.isArray(body.existing) ? body.existing : [])
      .filter((e): e is string => typeof e === "string")
      .slice(0, 60)
    const focusAreas = (Array.isArray(body.focusAreas) ? body.focusAreas : [])
      .filter((f): f is string => typeof f === "string")
      .slice(0, 3)

    const system = `You write short, natural, CORRECT Spanish phrases for a B1-level parent to say out loud during daily life with their baby${body.childName ? ` (${body.childName})` : ""}.

Grammar is tú, always — never voseo, never vosotros. ${DIALECT_BLOCK[dialect]}

Phrases must be short enough to say naturally while holding a baby, warm, and varied in structure. Each needs a natural English gloss. Respond with a JSON object: {"phrases": [{"text": "...", "translation": "..."}]}`

    const user = isCapture
      ? `The parent hit a real-life gap — they wanted to say: "${body.capture!.trim().slice(0, 300)}". Give the ONE most natural way to say it (as they would to their baby or about their baby). "translation" = a natural English gloss of your Spanish.`
      : `Generate ${count} phrases for this moment: ${MOMENT_DESCRIPTIONS[moment!] ?? moment}.${
          focusAreas.length
            ? `\n\nWhere natural, prefer structures the parent needs practice with:\n${focusAreas.map((f) => `- ${f}`).join("\n")}`
            : ""
        }${
          existing.length
            ? `\n\nThe library already has these — do NOT duplicate or trivially rephrase them:\n${existing.map((e) => `- ${e}`).join("\n")}`
            : ""
        }`

    const response = await getOpenAI().chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    })

    const raw = response.choices[0]?.message?.content
    if (!raw) throw new Error("Empty response from phrase model")
    const data = JSON.parse(raw) as { phrases?: { text?: string; translation?: string }[] }
    const phrases = (data.phrases ?? [])
      .filter((p): p is { text: string; translation: string } => !!p?.text && !!p?.translation)
      .slice(0, count)

    posthog?.capture({
      distinctId: "server",
      event: "llm_call",
      properties: {
        type: isCapture ? "phrase_capture" : "phrase_pack_fill",
        model: MODEL,
        moment: moment ?? null,
        count: phrases.length,
        input_tokens: response.usage?.prompt_tokens ?? null,
        output_tokens: response.usage?.completion_tokens ?? null,
        total_tokens: response.usage?.total_tokens ?? null,
      },
    })

    return NextResponse.json({ phrases }, { headers: { "Cache-Control": "no-store" } })
  } catch (err) {
    console.error("[/api/phrases/generate]", err)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
