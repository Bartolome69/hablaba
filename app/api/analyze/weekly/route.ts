import { NextResponse } from "next/server"
import { getOpenAI } from "@/lib/openai"
import { posthog } from "@/lib/posthog-server"
import { getTopic } from "@/lib/exercises/taxonomy"

// The weekly report's one narrative-generation call. The client does the
// group-by over criar_voice_observations itself (they live in ITS storage);
// this route turns the resulting aggregates into a short, warm narrative —
// and resolves exercises-taxonomy tag ids to display names, which the Grow
// module can't do client-side (the boundary forbids it importing exercises
// code; same reason /api/analyze lives at the root).

export const runtime = "nodejs"
export const maxDuration = 30

const MODEL = "gpt-4o"

interface WeeklyPattern {
  tag: string
  count: number
  examples: { original?: string; corrected?: string; note?: string }[]
}

interface WeeklyRequest {
  stats: { sessions: number; minutes: number; userTurns: number; streakDays: number }
  patterns: WeeklyPattern[] // grammar/avoidance grouped by tag, descending count
  celebrations: string[] // target phrases actually used
  repetitions: { word: string; alternatives?: string }[]
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<WeeklyRequest>

    const stats = {
      sessions: Number(body.stats?.sessions) || 0,
      minutes: Number(body.stats?.minutes) || 0,
      userTurns: Number(body.stats?.userTurns) || 0,
      streakDays: Number(body.stats?.streakDays) || 0,
    }
    if (stats.sessions <= 0) {
      return NextResponse.json({ error: "Nothing to summarize" }, { status: 400 })
    }

    const patterns = (Array.isArray(body.patterns) ? body.patterns : [])
      .filter((p): p is WeeklyPattern => !!p && typeof p.tag === "string" && typeof p.count === "number")
      .slice(0, 5)
    const celebrations = (Array.isArray(body.celebrations) ? body.celebrations : [])
      .filter((c): c is string => typeof c === "string")
      .slice(0, 8)
    const repetitions = (Array.isArray(body.repetitions) ? body.repetitions : [])
      .filter((r): r is { word: string; alternatives?: string } => !!r && typeof r.word === "string")
      .slice(0, 4)

    // Resolve tag ids to Spanish display names. Unknown/voice-only tags fall
    // back to a humanized id so the client never renders a raw slug.
    const tagLabels: Record<string, string> = {}
    for (const p of patterns) {
      const topic = getTopic(p.tag)
      tagLabels[p.tag] = topic ? topic.spanish : p.tag.replace(/-/g, " ")
    }

    const facts = [
      `Sessions this week: ${stats.sessions}, total ${stats.minutes} minutes, the learner spoke ${stats.userTurns} times. Current daily streak: ${stats.streakDays} day(s).`,
      celebrations.length
        ? `Target phrases they successfully used in real conversation: ${celebrations.map((c) => `"${c}"`).join(", ")}.`
        : "",
      patterns.length
        ? `Recurring grammar patterns (grouped, with counts): ${patterns
            .map((p) => `${tagLabels[p.tag]} ×${p.count} (e.g. ${p.examples[0]?.original ?? "—"} → ${p.examples[0]?.corrected ?? p.examples[0]?.note ?? "—"})`)
            .join("; ")}.`
        : "No recurring grammar patterns this week.",
      repetitions.length
        ? `Over-used vocabulary: ${repetitions.map((r) => `"${r.word}"${r.alternatives ? ` (alternatives: ${r.alternatives})` : ""}`).join(", ")}.`
        : "",
    ]
      .filter(Boolean)
      .join("\n")

    const response = await getOpenAI().chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `You write the weekly summary for a B1 Spanish learner's spoken-practice app. Voice: warm, specific, encouraging — a coach who actually listened, not a report generator. Spanish only, tú register (never voseo, never vosotros), no emojis, no headings, no lists.

Write 3–5 sentences: open with what they DID (the numbers, made human), celebrate real wins by quoting a phrase they used if there is one, then name at most TWO things to focus on next week — framed as an invitation, never a scolding. If there were no patterns, say their Spanish held up well and encourage more talking.

Respond with a JSON object: {"narrative": "..."}`,
        },
        { role: "user", content: facts },
      ],
      response_format: { type: "json_object" },
    })

    const raw = response.choices[0]?.message?.content
    if (!raw) throw new Error("Empty response from weekly narrative model")
    const data = JSON.parse(raw) as { narrative?: string }
    if (!data.narrative?.trim()) throw new Error("Weekly narrative missing")

    posthog?.capture({
      distinctId: "server",
      event: "llm_call",
      properties: {
        type: "criar_voice_weekly_narrative",
        model: MODEL,
        input_tokens: response.usage?.prompt_tokens ?? null,
        output_tokens: response.usage?.completion_tokens ?? null,
        total_tokens: response.usage?.total_tokens ?? null,
      },
    })

    return NextResponse.json(
      { narrative: data.narrative.trim(), tagLabels },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch (err) {
    console.error("[/api/analyze/weekly]", err)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
