import { NextResponse } from "next/server"
import { getOpenAI } from "@/lib/openai"
import { posthog } from "@/lib/posthog-server"
import { topics } from "@/lib/exercises/taxonomy"
import { VOICE_ONLY_TAGS, type VoiceObservationType } from "@/lib/voice/types"

// Post-session transcript analysis: transcript in, tagged observations out.
// Stateless like every LLM route here — the client owns persistence.
//
// This route sits at the root (not under /api/criar/) deliberately: it needs
// the exercises taxonomy for tag validation, and the Grow module must not
// import lib/exercises. A shared route may import both sides.
//
// TAGS ARE THE LOAD-BEARING DESIGN DECISION. Grammar observations must be
// tagged with an exercises-taxonomy topic id (lib/exercises/taxonomy.json) —
// that closed vocabulary is what lets the session review deep-link straight
// into practice (/app/exercises?topic=<tag>) and what makes the future weekly
// report a group-by instead of prose soup. The model chooses from an enum
// enforced by structured output AND re-validated below.
//
// WEEKLY REPORT HOOK: the report reuses this observation shape — 7 days of
// rows grouped by (type, detail.tag) plus one narrative call. Extend here,
// not with a parallel schema.

export const runtime = "nodejs"
export const maxDuration = 60

// Analysis quality lives or dies on the avoidance/pattern detection, so this
// stays a strong model rather than a mini. Swapping the vendor (e.g. Claude,
// which the original spec named) means replacing runAnalysisModel() only.
const MODEL = "gpt-4o"

const MAX_OBSERVATIONS = 8
const MAX_TURNS = 200
const MAX_TURN_CHARS = 600

const OBSERVATION_TYPES: VoiceObservationType[] = [
  "error_grammar",
  "avoidance",
  "repetition",
  "code_switch",
  "target_phrase_used",
]

const VALID_TAGS = new Set<string>([...topics.map((t) => t.id), ...VOICE_ONLY_TAGS])

interface AnalyzeRequestTurn {
  id: string
  speaker: "user" | "assistant"
  text: string
  ordinal: number
}

interface AnalyzeRequest {
  turns: AnalyzeRequestTurn[]
  seedContext?: {
    packPhrases?: string[]
    captureLessons?: { request: string; spanish: string }[]
  }
}

export interface AnalyzeObservation {
  turnId: string | null
  type: VoiceObservationType
  detail: { original?: string; corrected?: string; note?: string; tag?: string }
}

function buildSystemPrompt(): string {
  const topicList = topics.map((t) => `- ${t.id}: ${t.title} (${t.blurb})`).join("\n")

  return `You analyze the transcript of a spoken Spanish practice conversation. The learner ("user" turns) is an English-speaking parent at B1 level, learning Argentine Spanish in the tú register (NOT voseo), chatting about daily life with their baby. The "assistant" turns are the AI partner — never analyze those; they are context only.

Produce at most ${MAX_OBSERVATIONS} observations, ordered most useful first. Prefer PATTERNS (something that happened 2+ times) over one-off slips. Speech-to-text quirks (missing punctuation, mis-heard words, fillers) are NOT errors — ignore anything that is plausibly transcription noise rather than the learner's Spanish.

Observation types:
- "target_phrase_used": the learner successfully used (even loosely) a phrase from TARGET MATERIAL below. Celebrate these — find them first. detail.original = what they said, detail.tag = "target-phrase".
- "error_grammar": a real grammar error in a user turn. detail.original = their words (trimmed to the relevant clause), detail.corrected = the natural tú-register version, detail.tag = the ONE topic id from the list below that best names the rule involved (or "other" if none fits).
- "avoidance": a structure the learner visibly steered around (e.g. narrated yesterday in present tense, circumlocuted instead of subjunctive). turnId may be null if it spans the session. detail.note explains what they avoided; detail.tag = the topic id for the avoided structure (or "other").
- "repetition": over-reliance on the same verb/noun across the session (roughly 4+ uses where variety was natural). detail.original = the overused word, detail.corrected = 2–3 natural alternatives, comma-separated. detail.tag = "vocab-repetition". turnId = null.
- "code_switch": the learner dropped into English for a word/phrase. detail.original = the English, detail.corrected = the natural Rioplatense equivalent, detail.tag = "code-switch".

Topic ids (the ONLY valid grammar tags):
${topicList}

detail.note: one short encouraging sentence in Spanish (tú register, warm, never scolding — "casi lo tenés" energy without voseo, e.g. "¡Muy cerca! Solo cambia el tiempo verbal."). Every observation needs a note.

detail.corrected must use tú forms, never voseo, never peninsular vocabulary.

turnId: copy the exact id of the user turn the observation belongs to, or null for session-level patterns.

If the learner's Spanish was genuinely clean, return fewer observations — even zero. Never invent problems to fill the quota; quality over quantity.`
}

/**
 * The single vendor-specific call. Swapping to the Anthropic API (per the
 * original spec) means rewriting this function and nothing else.
 */
async function runAnalysisModel(system: string, userPayload: string): Promise<AnalyzeObservation[]> {
  const response = await getOpenAI().chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: userPayload },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "voice_observations",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["observations"],
          properties: {
            observations: {
              type: "array",
              maxItems: MAX_OBSERVATIONS,
              items: {
                type: "object",
                additionalProperties: false,
                required: ["turnId", "type", "original", "corrected", "note", "tag"],
                properties: {
                  turnId: { type: ["string", "null"] },
                  type: { type: "string", enum: OBSERVATION_TYPES },
                  original: { type: ["string", "null"] },
                  corrected: { type: ["string", "null"] },
                  note: { type: "string" },
                  tag: { type: "string", enum: [...VALID_TAGS] },
                },
              },
            },
          },
        },
      },
    },
  })

  const raw = response.choices[0]?.message?.content
  if (!raw) throw new Error("Empty response from analysis model")
  const parsed = JSON.parse(raw) as {
    observations: {
      turnId: string | null
      type: VoiceObservationType
      original: string | null
      corrected: string | null
      note: string
      tag: string
    }[]
  }

  posthog?.capture({
    distinctId: "server",
    event: "llm_call",
    properties: {
      type: "criar_voice_analysis",
      model: MODEL,
      input_tokens: response.usage?.prompt_tokens ?? null,
      output_tokens: response.usage?.completion_tokens ?? null,
      total_tokens: response.usage?.total_tokens ?? null,
    },
  })

  return parsed.observations.map((o) => ({
    turnId: o.turnId,
    type: o.type,
    detail: {
      original: o.original ?? undefined,
      corrected: o.corrected ?? undefined,
      note: o.note,
      tag: o.tag,
    },
  }))
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<AnalyzeRequest>

    const turns = (Array.isArray(body.turns) ? body.turns : [])
      .filter(
        (t): t is AnalyzeRequestTurn =>
          !!t &&
          typeof t.id === "string" &&
          (t.speaker === "user" || t.speaker === "assistant") &&
          typeof t.text === "string" &&
          typeof t.ordinal === "number",
      )
      .slice(0, MAX_TURNS)

    if (!turns.some((t) => t.speaker === "user")) {
      return NextResponse.json({ error: "No user turns to analyze" }, { status: 400 })
    }

    const userTurnIds = new Set(turns.filter((t) => t.speaker === "user").map((t) => t.id))

    const packPhrases = (body.seedContext?.packPhrases ?? [])
      .filter((p): p is string => typeof p === "string")
      .slice(0, 40)
    const captureLessons = (body.seedContext?.captureLessons ?? [])
      .filter(
        (l): l is { request: string; spanish: string } =>
          !!l && typeof l.request === "string" && typeof l.spanish === "string",
      )
      .slice(0, 10)

    const transcript = turns
      .map((t) => `[${t.speaker === "user" ? "USER" : "PARTNER"} id=${t.id}] ${t.text.slice(0, MAX_TURN_CHARS)}`)
      .join("\n")

    const targetMaterial =
      packPhrases.length || captureLessons.length
        ? `TARGET MATERIAL the session was seeded with (check the learner's turns for uses of these):\n${[
            ...packPhrases.map((p) => `- ${p}`),
            ...captureLessons.map((l) => `- ${l.spanish} (they wanted to learn: "${l.request}")`),
          ].join("\n")}\n\n`
        : ""

    const observations = (
      await runAnalysisModel(buildSystemPrompt(), `${targetMaterial}TRANSCRIPT:\n${transcript}`)
    )
      // Belt and braces past the schema: a turnId must reference a real USER
      // turn (a hallucinated or partner id becomes a session-level finding),
      // and tags must be from the closed vocabulary.
      .map((o) => ({
        ...o,
        turnId: o.turnId && userTurnIds.has(o.turnId) ? o.turnId : null,
        detail: {
          ...o.detail,
          tag: o.detail.tag && VALID_TAGS.has(o.detail.tag) ? o.detail.tag : "other",
        },
      }))
      .filter((o) => OBSERVATION_TYPES.includes(o.type))
      .slice(0, MAX_OBSERVATIONS)

    return NextResponse.json({ observations }, { headers: { "Cache-Control": "no-store" } })
  } catch (err) {
    console.error("[/api/analyze]", err)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
