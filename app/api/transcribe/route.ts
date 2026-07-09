import OpenAI from "openai"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const file = form.get("audio")
    if (!(file instanceof File)) {
      return Response.json({ error: "audio file required" }, { status: 400 })
    }

    // Defaults to Spanish; pass language="auto" to let the model detect
    // (Criar captures are often English or mixed).
    const language = form.get("language")
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "gpt-4o-transcribe",
      ...(language === "auto" ? {} : { language: typeof language === "string" ? language : "es" }),
    })

    return Response.json({ text: transcription.text })
  } catch (err) {
    console.error("[/api/transcribe]", err)
    return Response.json({ error: "transcription failed" }, { status: 500 })
  }
}
