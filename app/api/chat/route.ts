import { NextResponse } from "next/server"
import { getOpenAI } from "@/lib/openai"
import { posthog } from "@/lib/posthog-server"
import { PARENT_CHILD_TOPIC_ID } from "@/lib/data"

// Known structured topic IDs — anything else is treated as a freeform surprise theme
const conversationTopicIds = new Set([
  "restaurant","travel","family","work","weekend","movies","food","sports",
  "morning","dinner","shopping","endofday","house","coffee",
])

// Two separate blocks, and the order matters.
//
// These were briefly ONE block that opened "Use natural Argentine
// (Rioplatense) Spanish, addressing the user as tú". Rioplatense IS voseo, so
// naming the dialect that way outweighed the tú bullet underneath it: she
// started speaking voseo AND rewriting the learner's correct tú into it —
// "pones" marked wrong and "corrected" to "ponés". Teaching the opposite of
// the rule, and calling right answers mistakes.
//
// So it's structured the way lib/voice/prompts.ts does it, which has never had
// the problem: grammar is its own emphatic block, and the dialect block only
// ever names VOCABULARY. Never describe her Spanish as "Argentine Spanish" or
// "Rioplatense Spanish" here — that phrase carries the grammar with it.
export type ChatDialect = "rioplatense" | "neutral"

const TU_GRAMMAR = `REGISTER — grammar is tú, always. This outranks every flavour note below.
- Use tú forms: "tienes", "quieres", "pones", "puedes", "sabes"; tú imperatives "mira", "cuéntame", "dime", "ayúdame"
- NEVER voseo. Not "tenés", "querés", "ponés", "hacés", "sabés", "animás", "contame", "mirá", "ayudame". Not "vos"
- NEVER vosotros — use "ustedes"
- This governs the "correction" field too. A correct tú form is CORRECT: never rewrite "pones" as "ponés", "tienes" as "tenés", or any tú form into voseo. Doing that marks a right answer wrong and teaches the learner the opposite of the rule`

const DIALECT_FLAVOUR: Record<ChatDialect, string> = {
  rioplatense: `FLAVOUR — Argentine VOCABULARY on tú grammar: pañal, chupete, upa, mamadera, cochecito, "che", "dale", "qué lindo", "re". Peninsular words are errors ("vale", "guay", "coger", "ordenador", "zumo"). Keep it approachable for a B1 learner.`,
  neutral: `FLAVOUR — neutral Latin American vocabulary: clear and widely understood ("carro", "computadora"). Avoid strongly region-marked slang; peninsular words are errors ("vale", "guay", "coger", "ordenador", "zumo"). Keep it approachable for a B1 learner.`,
}

/**
 * Repeated as a system message AFTER the history, immediately before the new
 * user turn.
 *
 * Putting the rule only at the top of the prompt was not enough: an existing
 * thread is full of the assistant's own earlier voseo, and a demonstrated
 * pattern across a dozen turns beats a rule stated once, a long way back. The
 * model kept saying "podés"/"ponés" in threads that were already voseo, and
 * kept "correcting" the learner's tú into it. Hence the last line — the
 * history has to be explicitly disowned, not just outranked.
 */
const REGISTER_REMINDER = `REGISTER CHECK — before you answer, regardless of anything earlier in this conversation:
- Use tú. "puedes", "pones", "quieres", "tienes", "te animas". Never "podés", "ponés", "querés", "tenés", "animás", "vos".
- If earlier replies in this thread used voseo, they were WRONG. Do not copy them, and do not treat them as the established style.
- Never rewrite the learner's correct tú into voseo in the correction field.`

function asDialect(value: unknown): ChatDialect {
  return value === "neutral" ? "neutral" : "rioplatense"
}

const partnerPrompt = (dialect: ChatDialect) => `You are a friendly Spanish conversation partner and tutor helping an intermediate (B1) learner practice conversational Spanish.

${TU_GRAMMAR}

${DIALECT_FLAVOUR[dialect]}

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
Include "correction" ONLY when the user's Spanish has a real mistake or is genuinely unnatural. If it is fine, OMIT the field entirely — do not invent something to fill the slot, and do not send back their own words as a "correction".
READ THEM WITH CONTEXT, AND TAKE THE OBVIOUS READING. The user types on a phone with no accent layout, so accents and Spanish punctuation are simply missing from everything they write. "Que decimos ?" is "¿Qué decimos?". "esta bien" is "está bien". "como estas" is "¿cómo estás?". "el come" is "él come" if the context is about a person. Work out what they meant and answer THAT — never treat a missing accent as ambiguity, and never ask them which one they meant.
NEVER correct accents, punctuation or capitalisation. Not even when the accent would change the word — you already worked out which word they meant from the context, so there is nothing left to tell them, and flagging it teaches nothing they can act on while using up the one correction they get. Correct GRAMMAR, VERB FORMS, WORD CHOICE and NATURALNESS only. If the sentence is right apart from accents and punctuation, omit "correction" entirely.
"original" must be the user's words and "corrected" must be a rewrite of THOSE WORDS. Never put your reply, an example, a list, or the answer to their question in "corrected" — that field is their sentence, fixed, and nothing else.
Emit the "reply" field first in the JSON object.
Do not include any text outside the JSON object.`

const childPrompt = (dialect: ChatDialect) => `You are roleplaying as the user's own young child (around 4-6 years old), so the user — a parent doing "one parent, one language" practice — can rehearse natural everyday Spanish conversation with their kid.

${TU_GRAMMAR}

${DIALECT_FLAVOUR[dialect]}

Rules:
- Stay fully in character as the child: simple vocabulary, short excited sentences, genuine kid concerns and curiosity
- Always respond in Spanish, naturally and conversationally, as the child would speak
- Keep responses short: 1–3 sentences
- Keep the conversation about everyday parent-child moments — meals, getting dressed, playtime, feelings, bedtime, chores, small outings — and keep the back-and-forth going the way a real child would
- Never use emojis in your replies
- If the parent writes in English, respond only with a short, in-character Spanish nudge to use Spanish (e.g. "¡Habla en español, mami!"). Do not answer the English message. Omit the correction field.
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
Include "correction" ONLY when the parent's Spanish has a real mistake or is genuinely unnatural. If it is fine, OMIT the field entirely — do not invent something to fill the slot, and do not send back their own words as a "correction".
READ THEM WITH CONTEXT, AND TAKE THE OBVIOUS READING. The parent types on a phone with no accent layout, so accents and Spanish punctuation are simply missing from everything they write. "Que decimos ?" is "¿Qué decimos?". "esta bien" is "está bien". "como estas" is "¿cómo estás?". "el come" is "él come" if the context is about a person. Work out what they meant and answer THAT — never treat a missing accent as ambiguity, and never ask them which one they meant.
NEVER correct accents, punctuation or capitalisation. Not even when the accent would change the word — you already worked out which word they meant from the context, so there is nothing left to tell them, and flagging it teaches nothing they can act on while using up the one correction they get. Correct GRAMMAR, VERB FORMS, WORD CHOICE and NATURALNESS only. If the sentence is right apart from accents and punctuation, omit "correction" entirely.
"original" must be the parent's words and "corrected" must be a rewrite of THOSE WORDS. Never put your reply, an example, a list, or the answer to their question in "corrected" — that field is their sentence, fixed, and nothing else.
Emit the "reply" field first in the JSON object.
Do not include any text outside the JSON object.`

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { message, history, opener, topic, topicId, dialect } = body as {
      message?: string
      history: { role: "user" | "assistant"; content: string }[]
      opener?: boolean
      topic?: string
      topicId?: string
      dialect?: string
    }

    const isParentChild = topicId === PARENT_CHILD_TOPIC_ID
    const chatDialect = asDialect(dialect)
    const systemPrompt = isParentChild ? childPrompt(chatDialect) : partnerPrompt(chatDialect)

    // Opener mode: bot asks the first question for a topic
    if (opener && topic) {
      const isSurprise = topic === "surprise" || !conversationTopicIds.has(topic)
      const openerInstruction = isParentChild
        ? `You just did or noticed something related to: "${topic}". Say one short, natural thing in Spanish to your parent about it, in character as the child, to kick off the conversation. Do not correct anything — just speak as the child.`
        : isSurprise
          ? `Ask the user one spontaneous, engaging question in Spanish about: "${topic}". Keep it natural and conversational. Do not correct anything — just ask the question.`
          : `Start a conversation about the topic: "${topic}". Ask the user one engaging opening question in Spanish to kick things off. Do not correct anything — just ask the question.`

      const response = await getOpenAI().chat.completions.create({
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

    // Stream the model's JSON as it's generated so the reply shows up
    // token-by-token instead of after the whole completion. The client reads
    // the growing JSON, renders the "reply" field live (emitted first), and
    // parses translation + correction from the final payload.
    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "system", content: REGISTER_REMINDER },
        { role: "user", content: message },
      ],
      response_format: { type: "json_object" },
      stream: true,
      stream_options: { include_usage: true },
    })

    const encoder = new TextEncoder()
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const delta = chunk.choices[0]?.delta?.content
            if (delta) controller.enqueue(encoder.encode(delta))
            if (chunk.usage) {
              posthog?.capture({
                distinctId: "server",
                event: "llm_call",
                properties: {
                  type: "message",
                  topic: topic ?? null,
                  topicId: topicId ?? null,
                  model: "gpt-4o",
                  streamed: true,
                  input_tokens: chunk.usage.prompt_tokens ?? null,
                  output_tokens: chunk.usage.completion_tokens ?? null,
                  total_tokens: chunk.usage.total_tokens ?? null,
                },
              })
            }
          }
          controller.close()
        } catch (streamErr) {
          controller.error(streamErr)
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    console.error("[/api/chat]", err)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
