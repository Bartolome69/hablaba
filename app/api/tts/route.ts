import OpenAI from "openai"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  try {
    const { text, gender } = await req.json() as { text: string; gender: "male" | "female" }

    if (!text?.trim()) {
      return new Response("Text is required", { status: 400 })
    }

    const voice = gender === "male" ? "onyx" : "nova"

    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice,
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
