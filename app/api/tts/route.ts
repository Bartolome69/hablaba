import OpenAI from "openai"
import type { VoiceId } from "@/lib/voices"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const validVoices: VoiceId[] = ["nova", "shimmer", "alloy", "onyx", "echo", "fable"]

export async function POST(req: Request) {
  try {
    const { text, voice } = await req.json() as { text: string; voice: VoiceId }

    if (!text?.trim()) {
      return new Response("Text is required", { status: 400 })
    }

    const safeVoice = validVoices.includes(voice) ? voice : "nova"

    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice: safeVoice,
      input: text,
    })

    const buffer = Buffer.from(await response.arrayBuffer())

    return new Response(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=3600",
      },
    })
  } catch (err) {
    console.error("[/api/tts]", err)
    return new Response("Failed to generate audio", { status: 500 })
  }
}
