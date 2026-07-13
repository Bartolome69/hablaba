import { NextResponse } from "next/server"
import OpenAI from "openai"
import type { Correction } from "@/lib/types"
import { posthog } from "@/lib/posthog-server"
import { PARENT_CHILD_TOPIC_ID } from "@/lib/data"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Known structured topic IDs — anything else is treated as a freeform surprise theme
const conversationTopicIds = new Set([
  "restaurant","travel","family","work","weekend","movies","food","sports",
  "morning","dinner","shopping","endofday","house","coffee",
])

const SYSTEM_PROMPT = `You are a friendly Spanish conversation partner and tutor helping an intermediate (B1) learner practice conversational Spanish.

Use natural Rioplatense (Argentine / Buenos Aires) Spanish. Specifically:
- Use voseo: "vos" instead of "tú" (vos tenés, vos sos, vos querés; imperatives like mirá, vení, escuchá, dale)
- Use "ustedes" instead of "vosotros"
- Use Argentine vocabulary and expressions where natural (acá not aquí, laburo, plata, un montón, dale, che)
- Avoid peninsular Spanish and neutral Mexican/Colombian vocabulary
- Keep vocabulary approachable for a B1 learner

Rules:
- Always respond in Spanish, naturally and conversationally
- Keep responses short: 1–3 sentences
- Always end your reply with a follow-up question to keep the conversation going
- Never use emojis in your replies
- If the user writes in English, respond only with a short Spanish reminder to write in Spanish (e.g. "¡Dale, escribí en español!"). Do not answer the English message. Omit the correction field.
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

const SYSTEM_PROMPT_PARENT_CHILD = `You are roleplaying as the user's own young child (around 4-6 years old), so the user — a parent doing "one parent, one language" practice — can rehearse natural everyday Spanish conversation with their kid.

Use natural Rioplatense (Argentine / Buenos Aires) Spanish. Specifically:
- Use voseo: "vos" instead of "tú" (vos tenés, mirá, vení, dale)
- Use "ustedes" instead of "vosotros"
- Use Argentine vocabulary and expressions where natural (acá, dale, un montón)
- Avoid peninsular Spanish and neutral Mexican/Colombian vocabulary

Rules:
- Stay fully in character as the child: simple vocabulary, short excited sentences, genuine kid concerns and curiosity
- Always respond in Spanish, naturally and conversationally, as the child would speak
- Keep responses short: 1–3 sentences
- Keep the conversation about everyday parent-child moments — meals, getting dressed, playtime, feelings, bedtime, chores, small outings — and keep the back-and-forth going the way a real child would
- Never use emojis in your replies
- If the parent writes in English, respond only with a short, in-character Spanish nudge to use Spanish (e.g. "¡Hablá en español, mami!"). Do not answer the English message. Omit the correction field.
- If the parent's Spanish has a grammatical or unnatural mistake, include a correction — the correction is adult-facing feedback for the parent, even though your in-character reply stays childlike
- Do not overwhelm the parent with grammar explanations — keep it warm and encouraging
- Prioritize natural, everyday parent-child phrases over perfection

You must ALWAYS respond with a valid JSON object in this exact format:
{
  "reply": "Your in-character Spanish response here",
  "translation": "Natural English translation of your reply",
  "correction": {
    "original": "The parent's original text",
    "corrected": "The most natural native-speaker version",
    "corrected_translation": "English translation of the corrected phrase",
    "explanation": "Brief explanation in English, 1 sentence max"
  }
}

Always include the "translation" field.
Always include the "correction" field for every parent message — even if their Spanish is perfect, provide the most natural native-speaker phrasing. If it is already perfect, set "corrected" to the same text and explanation to something encouraging like "Perfect — that's exactly how a native speaker would say it."
Do not include any text outside the JSON object.`

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { message, history, opener, topic, topicId } = body as {
      message?: string
      history: { role: "user" | "assistant"; content: string }[]
      opener?: boolean
      topic?: string
      topicId?: string
    }

    const isParentChild = topicId === PARENT_CHILD_TOPIC_ID
    const systemPrompt = isParentChild ? SYSTEM_PROMPT_PARENT_CHILD : SYSTEM_PROMPT

    // Opener mode: bot asks the first question for a topic
    if (opener && topic) {
      const isSurprise = topic === "surprise" || !conversationTopicIds.has(topic)
      const openerInstruction = isParentChild
        ? `You just did or noticed something related to: "${topic}". Say one short, natural thing in Spanish to your parent about it, in character as the child, to kick off the conversation. Do not correct anything — just speak as the child.`
        : isSurprise
          ? `Ask the user one spontaneous, engaging question in Spanish about: "${topic}". Keep it natural and conversational. Do not correct anything — just ask the question.`
          : `Start a conversation about the topic: "${topic}". Ask the user one engaging opening question in Spanish to kick things off. Do not correct anything — just ask the question.`

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: openerInstruction },
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
          type: "opener",
          topic,
          topicId: topicId ?? null,
          model: "gpt-4o",
          input_tokens: response.usage?.prompt_tokens ?? null,
          output_tokens: response.usage?.completion_tokens ?? null,
          total_tokens: response.usage?.total_tokens ?? null,
        },
      })

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
        { role: "system", content: systemPrompt },
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

    posthog?.capture({
      distinctId: "server",
      event: "llm_call",
      properties: {
        type: "message",
        topic: topic ?? null,
        topicId: topicId ?? null,
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
    console.error("[/api/chat]", err)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
