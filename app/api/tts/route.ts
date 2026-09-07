import { getOpenAI } from "@/lib/openai"
import { PARTNER_VOICE } from "@/lib/voices"

// How she sounds when she's reading rather than conversing.
//
// Two axes, because the old single instruction conflated them and got both
// wrong. It described "a warm and patient tutor" with "gentle emphasis on key
// words" — an instruction to slow down and enunciate, applied to EVERY spoken
// line including a message she'd just said aloud in voice mode. And the
// porteño option below it was dead: the only caller that ever passed a
// register was the Grow module, which was retired in the August restructure,
// so since then every speaker button in the app has spoken neutral Spanish
// regardless of the learner's dialect setting.
//
// ACCENT is who she is and follows the profile. MANNER is what this particular
// line is for. They vary independently.

export type TtsDialect = "rioplatense" | "neutral"
/** What the line is for — a conversation replayed, or material being learnt. */
export type TtsManner = "conversational" | "clear"

const ACCENT: Record<TtsDialect, string> = {
  rioplatense:
    "Speak in Rioplatense (Buenos Aires) Spanish: pronounce 'll' and 'y' as 'sh' (sheísmo — 'yo' as 'sho', 'calle' as 'cashe'), with the characteristic Italian-influenced rising-and-falling intonation.",
  neutral:
    "Speak in neutral Latin American Spanish: clear and widely understood, without strongly region-marked pronunciation.",
}

const MANNER: Record<TtsManner, string> = {
  // Deliberately echoes the VOICE block in lib/voice/prompts.ts, so a line she
  // said in voice mode sounds like the same performance when it's replayed.
  conversational:
    "You are speech, not text: contractions, natural rhythm, unhurried but not slow. Say it the way you would in conversation, not the way you would read it out.",
  // Study material — a phrase or a single word the learner is working on. Same
  // person, same accent, just given room.
  clear:
    "The learner is trying to learn this, so give it room: a little slower than conversation, every word distinct, natural stress. Warm and human, never clipped or robotic.",
}

const WHO = "You are a warm, patient Argentine woman talking with a parent who is learning Spanish."

function instructionsFor(dialect: TtsDialect, manner: TtsManner): string {
  return `${WHO} ${ACCENT[dialect]} ${MANNER[manner]}`
}

function asDialect(value: unknown): TtsDialect {
  return value === "neutral" ? "neutral" : "rioplatense"
}

function asManner(value: unknown): TtsManner {
  return value === "conversational" ? "conversational" : "clear"
}

async function handleTTS(text: string | undefined, dialect: TtsDialect, manner: TtsManner) {
  if (!text?.trim()) {
    return new Response("Text is required", { status: 400 })
  }

  // Her voice, not a request parameter — the same constant /api/voice/session
  // uses, so the speaker button and voice mode cannot drift apart. A `voice`
  // in the query is ignored rather than rejected: urls are cached for a year,
  // so old ones with the parameter still resolve to her.
  const voice = PARTNER_VOICE
  const instructions = instructionsFor(dialect, manner)

  const response = await getOpenAI().audio.speech.create({
    model: "gpt-4o-mini-tts",
    voice,
    input: text.trim(),
    instructions,
    response_format: "mp3",
  })

  return new Response(response.body, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const text = url.searchParams.get("text") ?? undefined
    return await handleTTS(
      text,
      asDialect(url.searchParams.get("dialect")),
      asManner(url.searchParams.get("manner")),
    )
  } catch (err) {
    console.error("[/api/tts]", err)
    return new Response("Failed to generate audio", { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { text, dialect, manner } = await req.json()
    return await handleTTS(text, asDialect(dialect), asManner(manner))
  } catch (err) {
    console.error("[/api/tts]", err)
    return new Response("Failed to generate audio", { status: 500 })
  }
}
