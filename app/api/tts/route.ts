import OpenAI from "openai"
import type { VoiceId } from "@/lib/voices"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const validVoices: VoiceId[] = ["nova", "shimmer", "alloy", "onyx", "echo", "fable"]

const VOICE_INSTRUCTIONS =
  "Speak in clear, natural Spanish at a conversational pace, like a warm and patient tutor. Use natural prosody and gentle emphasis on key words."

// Optional dialect registers. "rioplatense" is used across Speak, Practice and
// the Criar/Grow module for a consistent Argentine accent.
const REGISTER_INSTRUCTIONS: Record<string, string> = {
  rioplatense:
    "Speak in Rioplatense Argentine Spanish with a Buenos Aires (porteño) accent: pronounce 'll' and 'y' as 'sh' (sheísmo, e.g. 'yo' as 'sho', 'calle' as 'cashe'), with the characteristic Italian-influenced rising-and-falling intonation. Warm, natural and conversational.",
}

async function handleTTS(
  text: string | undefined,
  voiceParam: VoiceId | null,
  register?: string | null,
) {
  if (!text?.trim()) {
    return new Response("Text is required", { status: 400 })
  }

  const voice = voiceParam && validVoices.includes(voiceParam) ? voiceParam : "nova"
  const instructions = (register && REGISTER_INSTRUCTIONS[register]) || VOICE_INSTRUCTIONS

  const response = await openai.audio.speech.create({
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
    const voiceParam = url.searchParams.get("voice") as VoiceId | null
    return await handleTTS(text, voiceParam, url.searchParams.get("register"))
  } catch (err) {
    console.error("[/api/tts]", err)
    return new Response("Failed to generate audio", { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { text, voice, register } = await req.json()
    return await handleTTS(text, voice as VoiceId | null, register as string | null)
  } catch (err) {
    console.error("[/api/tts]", err)
    return new Response("Failed to generate audio", { status: 500 })
  }
}
