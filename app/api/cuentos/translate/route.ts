import { NextResponse } from "next/server"
import { getOpenAI } from "@/lib/openai"
import { posthog } from "@/lib/posthog-server"
import { TRANSLATION_FORMAT, translationSystemPrompt, TU_RETRY } from "@/lib/cuentos/prompts"
import { containsVoseo } from "@/lib/voseo"

// Cuentos: one picture-book page of English in, child-level Spanish out,
// keeping rhyme and refrains (docs/cuentos-plan.md). Stateless; the device
// stores the result. gpt-4o rather than mini: rhyme and metre are the hard
// part. Nothing here logs the page text.
//
// The tú rule is checked in code as well as in the prompt (lib/voseo.ts):
// one retry if vos or vosotros slips in, then a 502 rather than teaching it.

export const runtime = "nodejs"
export const maxDuration = 30

const MODEL = "gpt-4o"
const MAX_CHARS = 2000

const VOSOTROS = /\b(vosotr[oa]s|vuestr[oa]s?)\b/i
const breaksTuRule = (text: string) => containsVoseo(text) || VOSOTROS.test(text)

type Dialect = "rioplatense" | "neutral"

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "no_key" }, { status: 503 })
  }
  try {
    const body = (await req.json()) as { text?: string; dialect?: string }
    const text = body.text?.trim()
    if (!text) return NextResponse.json({ error: "Text is required" }, { status: 400 })
    if (text.length > MAX_CHARS) return NextResponse.json({ error: "too_long" }, { status: 413 })
    const dialect: Dialect = body.dialect === "neutral" ? "neutral" : "rioplatense"

    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: translationSystemPrompt(dialect) },
      { role: "system", content: TRANSLATION_FORMAT },
      { role: "user", content: text },
    ]

    let usage = { input: 0, output: 0 }
    const ask = async () => {
      const response = await getOpenAI().chat.completions.create({
        model: MODEL,
        messages,
        temperature: 0.7,
        response_format: { type: "json_object" },
      })
      usage = {
        input: usage.input + (response.usage?.prompt_tokens ?? 0),
        output: usage.output + (response.usage?.completion_tokens ?? 0),
      }
      const raw = response.choices[0]?.message?.content ?? ""
      const data = JSON.parse(raw) as { spanish?: string; notes?: string }
      return { raw, spanish: data.spanish?.trim() ?? "", notes: data.notes?.trim() ?? "" }
    }

    let result = await ask()
    let retried = false
    if (result.spanish && breaksTuRule(result.spanish)) {
      retried = true
      messages.push({ role: "assistant", content: result.raw }, { role: "user", content: TU_RETRY })
      result = await ask()
    }

    posthog?.capture({
      distinctId: "server",
      event: "llm_call",
      properties: {
        type: "cuentos_translate",
        model: MODEL,
        dialect,
        tu_retry: retried,
        input_tokens: usage.input,
        output_tokens: usage.output,
      },
    })

    if (!result.spanish) throw new Error("Translation missing")
    if (breaksTuRule(result.spanish)) {
      return NextResponse.json({ error: "tu_rule" }, { status: 502 })
    }

    return NextResponse.json(
      { spanish: result.spanish, ...(result.notes ? { notes: result.notes } : {}) },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch (err) {
    // The error only: never the page text.
    console.error("[/api/cuentos/translate]", err instanceof Error ? err.message : "unknown error")
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
