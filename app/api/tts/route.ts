import { getOpenAI } from "@/lib/openai"
import { PARTNER_VOICE } from "@/lib/voices"

const VOICE_INSTRUCTIONS =
  "Speak in clear, natural Spanish at a conversational pace, like a warm and patient tutor. Use natural prosody and gentle emphasis on key words."

// Optional dialect registers. "rioplatense" is used by the Grow module for a
// Buenos Aires accent (Speak and Practice use the default neutral voice).
const REGISTER_INSTRUCTIONS: Record<string, string> = {
  rioplatense:
    "Speak in Rioplatense Argentine Spanish with a Buenos Aires (porteño) accent: pronounce 'll' and 'y' as 'sh' (sheísmo, e.g. 'yo' as 'sho', 'calle' as 'cashe'), with the characteristic Italian-influenced rising-and-falling intonation. Warm, natural and conversational.",
}

async function handleTTS(text: string | undefined, register?: string | null) {
  if (!text?.trim()) {
    return new Response("Text is required", { status: 400 })
  }

  // Her voice, not a request parameter — the same constant /api/voice/session
  // uses, so the speaker button and voice mode cannot drift apart. A `voice`
  // in the query is ignored rather than rejected: urls are cached for a year,
  // so old ones with the parameter still resolve to her.
  const voice = PARTNER_VOICE
  const instructions = (register && REGISTER_INSTRUCTIONS[register]) || VOICE_INSTRUCTIONS

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
    return await handleTTS(text, url.searchParams.get("register"))
  } catch (err) {
    console.error("[/api/tts]", err)
    return new Response("Failed to generate audio", { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { text, register } = await req.json()
    return await handleTTS(text, register as string | null)
  } catch (err) {
    console.error("[/api/tts]", err)
    return new Response("Failed to generate audio", { status: 500 })
  }
}
