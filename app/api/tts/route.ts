import OpenAI from "openai"
import type { VoiceId } from "@/lib/voices"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const validVoices: VoiceId[] = ["nova", "shimmer", "alloy", "onyx", "echo", "fable"]

const VOICE_INSTRUCTIONS =
  "Speak in clear, natural Spanish at a conversational pace, like a warm and patient tutor. Use natural prosody and gentle emphasis on key words."

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const text = url.searchParams.get("text")?.trim()
    const voiceParam = url.searchParams.get("voice") as VoiceId | null

    if (!text) {
      return new Response("Text is required", { status: 400 })
    }

    const voice = voiceParam && validVoices.includes(voiceParam) ? voiceParam : "nova"

    const response = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice,
      input: text,
      instructions: VOICE_INSTRUCTIONS,
      response_format: "mp3",
    })

    return new Response(response.body, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (err) {
    console.error("[/api/tts]", err)
    return new Response("Failed to generate audio", { status: 500 })
  }
}
