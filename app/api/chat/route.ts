import { NextResponse } from "next/server"
import OpenAI from "openai"
import type { Correction } from "@/lib/types"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SYSTEM_PROMPT = `You are a friendly Spanish conversation partner and tutor helping an intermediate (B1) learner practice conversational Spanish.

Use clear, natural Latin American Spanish (Colombian/Mexican). Specifically:
- Use "ustedes" instead of "vosotros"
- Use "carro" instead of "coche", "computadora" instead of "ordenador"
- Avoid Spain-specific slang or vocabulary
- Keep vocabulary approachable for a B1 learner

Rules:
- Always respond in Spanish, naturally and conversationally
- Keep responses short: 1–3 sentences
- Always end your reply with a follow-up question to keep the conversation going
- Never use emojis in your replies
- If the user writes in English, respond only with a short Spanish reminder to write in Spanish (e.g. "¡Por favor escribe en español!"). Do not answer the English message. Omit the correction field.
- If the user makes a grammatical or unnatural mistake, include a correction
- Do not overwhelm the user with grammar explanations — keep it encouraging
- Prioritize fluency and natural speech over perfection

You must ALWAYS respond with a valid JSON object in this exact format:
{
  "reply": "Your Spanish response here",
  "translation": "Natural English translation of your reply",
  "correction": {
    "original": "The user's original text",
    "corrected": "The most natural native-speaker version",
    "corrected_translation": "English translation of the corrected phrase",
    "explanation": "Brief explanation in English, 1 sentence max"
  }
}

Always include the "translation" field.
Always include the "correction" field for every user message — even if their Spanish is perfect, provide the most natural native-speaker phrasing. If it is already perfect, set "corrected" to the same text and explanation to something encouraging like "Perfect — that's exactly how a native speaker would say it."
Do not include any text outside the JSON object.`

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { message, history, opener, topic } = body as {
      message?: string
      history: { role: "user" | "assistant"; content: string }[]
      opener?: boolean
      topic?: string
    }

    // Opener mode: bot asks the first question for a topic
    if (opener && topic) {
      const openerInstruction = topic === "surprise"
        ? `Ask the user one unexpected, fun, and engaging question in Spanish to start a conversation. It can be about anything — daily life, opinions, hypotheticals, memories, or preferences. Make it feel spontaneous and interesting. Do not correct anything — just ask the question.`
        : `Start a conversation about the topic: "${topic}". Ask the user one engaging opening question in Spanish to kick things off. Do not correct anything — just ask the question.`

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: openerInstruction },
        ],
        response_format: { type: "json_object" },
      })

      const raw = response.choices[0]?.message?.content
      if (!raw) throw new Error("Empty response from OpenAI")

      const data = JSON.parse(raw) as { reply: string; translation?: string }

      return NextResponse.json({
        reply: data.reply,
        translation: data.translation ?? null,
        correction: null,
      })
    }

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...history,
        { role: "user", content: message },
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
    console.error("[/api/chat]", err)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
