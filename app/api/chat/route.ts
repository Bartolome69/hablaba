import { NextResponse } from "next/server"
import OpenAI from "openai"
import type { Correction } from "@/lib/types"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SYSTEM_PROMPT = `You are a friendly Spanish conversation partner and tutor helping an intermediate (B1) learner practice conversational Spanish.

Rules:
- Always respond in Spanish, naturally and conversationally
- Keep responses short: 1–3 sentences
- If the user makes a grammatical or unnatural mistake, include a correction
- Do not overwhelm the user with grammar explanations — keep it encouraging
- Prioritize fluency and natural speech over perfection

You must ALWAYS respond with a valid JSON object in this exact format:
{
  "reply": "Your Spanish response here",
  "correction": {
    "original": "The user's original text",
    "corrected": "The corrected, more natural version",
    "explanation": "Brief explanation in English, 1 sentence max"
  }
}

If the user's message is correct and natural, omit the "correction" field entirely.
Do not include any text outside the JSON object.`

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { message, history } = body as {
      message: string
      history: { role: "user" | "assistant"; content: string }[]
    }

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const response = await openai.responses.create({
      model: "gpt-4o",
      instructions: SYSTEM_PROMPT,
      input: [
        ...history,
        { role: "user", content: message },
      ],
      text: { format: { type: "json_object" } },
    })

    const data = JSON.parse(response.output_text) as {
      reply: string
      correction?: Correction
    }

    return NextResponse.json({
      reply: data.reply,
      correction: data.correction ?? null,
    })
  } catch (err) {
    console.error("[/api/chat]", err)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
