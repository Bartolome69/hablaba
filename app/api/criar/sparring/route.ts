import { NextResponse } from "next/server"
import OpenAI from "openai"
import type { Correction } from "@/lib/types"
import { buildSparringSystem, type SparringContext } from "@/lib/criar/prompts"
import { posthog } from "@/lib/posthog-server"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

interface SparringRequest {
  message?: string
  history: { role: "user" | "assistant"; content: string }[]
  opener?: boolean
  context: SparringContext
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SparringRequest

    if (!body.context?.childName?.trim()) {
      return NextResponse.json({ error: "context.childName is required" }, { status: 400 })
    }

    const system = buildSparringSystem({
      childName: body.context.childName.trim(),
      ageDescription: body.context.ageDescription?.trim() || "a few weeks",
      packPhrases: (body.context.packPhrases ?? []).slice(0, 40),
      captureLessons: (body.context.captureLessons ?? []).slice(0, 10),
    })

    // Opener mode: the friend starts the conversation
    if (body.opener) {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content:
              "Open the conversation: greet the parent warmly and ask one engaging question about their day with the baby, drawing on this week's material if natural. Do not correct anything — just open the conversation. Omit the correction field.",
          },
        ],
        response_format: { type: "json_object" },
      })

      const raw = response.choices[0]?.message?.content
      if (!raw) throw new Error("Empty response from OpenAI")
      const data = JSON.parse(raw) as { reply: string; translation?: string }

      posthog?.capture({
        distinctId: "server",
        event: "llm_call",
        properties: {
          type: "criar_sparring_opener",
          model: "gpt-4o",
          input_tokens: response.usage?.prompt_tokens ?? null,
          output_tokens: response.usage?.completion_tokens ?? null,
          total_tokens: response.usage?.total_tokens ?? null,
        },
      })

      return NextResponse.json({ reply: data.reply, translation: data.translation ?? null, correction: null })
    }

    if (!body.message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: system },
        ...(body.history ?? []),
        { role: "user", content: body.message },
      ],
      response_format: { type: "json_object" },
    })

    const raw = response.choices[0]?.message?.content
    if (!raw) throw new Error("Empty response from OpenAI")

    const data = JSON.parse(raw) as {
      reply: string
      translation?: string
      correction?: Correction & { corrected_translation?: string }
    }

    posthog?.capture({
      distinctId: "server",
      event: "llm_call",
      properties: {
        type: "criar_sparring_message",
        model: "gpt-4o",
        had_correction: !!data.correction,
        input_tokens: response.usage?.prompt_tokens ?? null,
        output_tokens: response.usage?.completion_tokens ?? null,
        total_tokens: response.usage?.total_tokens ?? null,
      },
    })

    return NextResponse.json({
      reply: data.reply,
      translation: data.translation ?? null,
      correction: data.correction
        ? {
            original: data.correction.original,
            corrected: data.correction.corrected,
            corrected_translation: data.correction.corrected_translation ?? null,
            explanation: data.correction.explanation ?? null,
          }
        : null,
    })
  } catch (err) {
    console.error("[/api/criar/sparring]", err)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
