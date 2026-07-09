import { NextResponse } from "next/server"
import OpenAI from "openai"
import type { PackApiRequest, PackApiResponse } from "@/lib/criar/types"
import { RIOPLATENSE_SYSTEM, buildPackUserPrompt } from "@/lib/criar/prompts"
import { posthog } from "@/lib/posthog-server"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const validMoments = new Set([
  "waking", "feed", "nappy", "pram-walk", "bath", "bedtime", "soothing",
])

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as PackApiRequest

    if (!body.childName?.trim() || !validMoments.has(body.moment)) {
      return NextResponse.json({ error: "childName and a valid moment are required" }, { status: 400 })
    }

    const request: PackApiRequest = {
      childName: body.childName.trim(),
      ageDescription: body.ageDescription?.trim() || "a few weeks",
      stage: body.stage ?? "newborn",
      moment: body.moment,
      captures: (body.captures ?? []).slice(0, 10),
      reinforcePhrases: (body.reinforcePhrases ?? []).slice(0, 30),
      avoidPhrases: (body.avoidPhrases ?? []).slice(0, 60),
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: RIOPLATENSE_SYSTEM },
        { role: "user", content: buildPackUserPrompt(request) },
      ],
      response_format: { type: "json_object" },
    })

    const raw = response.choices[0]?.message?.content
    if (!raw) throw new Error("Empty response from OpenAI")

    const data = JSON.parse(raw) as PackApiResponse
    if (!Array.isArray(data.phrases) || data.phrases.length === 0 || !data.song?.lyrics) {
      throw new Error("Malformed pack from OpenAI")
    }

    posthog?.capture({
      distinctId: "server",
      event: "llm_call",
      properties: {
        type: "criar_pack",
        moment: request.moment,
        stage: request.stage,
        capture_count: request.captures.length,
        model: "gpt-4o",
        input_tokens: response.usage?.prompt_tokens ?? null,
        output_tokens: response.usage?.completion_tokens ?? null,
        total_tokens: response.usage?.total_tokens ?? null,
      },
    })

    return NextResponse.json({
      phrases: data.phrases.map((p) => ({
        spanish: p.spanish,
        english: p.english,
        note: p.note || undefined,
      })),
      song: {
        title: data.song.title,
        kind: data.song.kind ?? "canción",
        lyrics: data.song.lyrics,
        english: data.song.english ?? "",
      },
      captureLessons: Array.isArray(data.captureLessons) ? data.captureLessons : [],
    } satisfies PackApiResponse)
  } catch (err) {
    console.error("[/api/criar/pack]", err)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
