import { NextResponse } from "next/server"
import { getOpenAI } from "@/lib/openai"
import { posthog } from "@/lib/posthog-server"
import { OCR_SYSTEM_PROMPT } from "@/lib/cuentos/prompts"

// Cuentos: a photo of a picture-book page in, the story text out
// (docs/cuentos-plan.md). The photo exists only in memory for this one call:
// it is never written to disk, never stored, and never logged, and neither is
// the text that comes back. The device downscales before upload (about 1600 px
// on the long edge), so 3 MB is generous and stays under Vercel's 4.5 MB body
// limit.

export const runtime = "nodejs"
export const maxDuration = 30

const MODEL = "gpt-4o"
const MAX_BYTES = 3 * 1024 * 1024
const TYPES = new Set(["image/jpeg", "image/png", "image/webp"])

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    // The device falls back to reading the page itself.
    return NextResponse.json({ error: "no_key" }, { status: 503 })
  }
  try {
    const form = await req.formData()
    const image = form.get("image")
    if (!(image instanceof Blob) || image.size === 0) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 })
    }
    if (image.size > MAX_BYTES) return NextResponse.json({ error: "too_large" }, { status: 413 })
    if (!TYPES.has(image.type)) return NextResponse.json({ error: "unsupported_type" }, { status: 415 })

    const dataUrl = `data:${image.type};base64,${Buffer.from(await image.arrayBuffer()).toString("base64")}`

    const response = await getOpenAI().chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: OCR_SYSTEM_PROMPT },
        {
          role: "user",
          content: [{ type: "image_url", image_url: { url: dataUrl, detail: "high" } }],
        },
      ],
      temperature: 0,
      response_format: { type: "json_object" },
    })

    posthog?.capture({
      distinctId: "server",
      event: "llm_call",
      properties: {
        type: "cuentos_ocr",
        model: MODEL,
        input_tokens: response.usage?.prompt_tokens ?? null,
        output_tokens: response.usage?.completion_tokens ?? null,
      },
    })

    const raw = response.choices[0]?.message?.content
    if (!raw) throw new Error("Empty response from OCR model")
    const data = JSON.parse(raw) as { text?: string; blocks?: { text?: string; confidence?: number }[] }
    const text = data.text?.trim() ?? ""
    if (!text) return NextResponse.json({ error: "no_text" }, { status: 422 })

    const blocks = (data.blocks ?? [])
      .filter((b) => b.text?.trim())
      .map((b) => ({ text: b.text!.trim(), ...(typeof b.confidence === "number" ? { confidence: b.confidence } : {}) }))

    return NextResponse.json({ text, blocks }, { headers: { "Cache-Control": "no-store" } })
  } catch (err) {
    // The error message only: never the image or the text.
    console.error("[/api/cuentos/ocr]", err instanceof Error ? err.message : "unknown error")
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
