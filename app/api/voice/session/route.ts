import { NextResponse } from "next/server"
import { getOpenAI } from "@/lib/openai"
import { posthog } from "@/lib/posthog-server"
import { buildVoiceInstructions, type SpanishDialect, type VoiceCorrectionLevel } from "@/lib/voice/prompts"
import { TOKEN_TTL_SECONDS, isCorrectionLevel } from "@/lib/voice/config"
import type { VoiceSeedContext } from "@/lib/voice/types"
import { resolveVoiceId } from "@/lib/voices"

// Mints a short-lived OpenAI Realtime client secret for the browser.
//
// Why this route exists at all: the browser needs to speak WebRTC directly to
// OpenAI, but must never see OPENAI_API_KEY. It gets an `ek_…` secret instead,
// which expires in TOKEN_TTL_SECONDS and only covers opening a session.
//
// The client sends the curriculum context (this week's pack phrases, capture
// lessons — assembled from localStorage, same query as sparring) and the
// correction preference; the instructions themselves are built HERE, server-
// side, so a caller can shape what the partner talks about but never rewrite
// who the partner is.
//
// Cost posture: like every other route in this app there is no auth to check
// (Hablaba has no user concept yet), so the guardrails are structural — a
// short credential TTL, model/voice fixed server-side, and inputs truncated
// below. The session-length cap lives on the client (MAX_SESSION_SECONDS);
// this route cannot enforce it, because a session outlives the secret that
// opened it. If this ever ships publicly it wants a real rate limit.

export const runtime = "nodejs"

const MODEL = "gpt-realtime"

// The voice comes from the learner's preference (`lib/voices.ts`), the same one
// the speaker button uses — one partner should not sound like two people
// depending on how you're talking to her. It used to be hardcoded here, which
// is exactly how the split happened.
//
// Still resolved SERVER-side: every id in that catalogue is valid on both
// gpt-realtime and gpt-4o-mini-tts, and resolveVoiceId falls back to the
// default rather than trusting a client string. The porteño accent comes from
// the instructions, not the voice id.

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Partial<VoiceSeedContext>

    const correctionLevel: VoiceCorrectionLevel = isCorrectionLevel(body.correctionLevel)
      ? body.correctionLevel
      : "normal"

    const voice = resolveVoiceId(body.voice)

    const instructions = buildVoiceInstructions({
      context: {
        // Empty childName = a child-free surface (Speak) — the builder swaps
        // to the generic-learner persona rather than inventing a baby.
        childName: typeof body.childName === "string" ? body.childName.trim() : "",
        ageDescription:
          typeof body.ageDescription === "string" ? body.ageDescription.trim() : "",
        packPhrases: (Array.isArray(body.packPhrases) ? body.packPhrases : [])
          .filter((p): p is string => typeof p === "string")
          .slice(0, 40),
        captureLessons: (Array.isArray(body.captureLessons) ? body.captureLessons : [])
          .filter(
            (l): l is { request: string; spanish: string } =>
              !!l && typeof l.request === "string" && typeof l.spanish === "string",
          )
          .slice(0, 10),
      },
      correctionLevel,
      dialect: (body.dialect === "neutral" ? "neutral" : "rioplatense") as SpanishDialect,
      topicId: typeof body.topicId === "string" ? body.topicId : undefined,
      focusAreas: (Array.isArray(body.focusAreas) ? body.focusAreas : [])
        .filter((f): f is string => typeof f === "string")
        .map((f) => f.slice(0, 200))
        .slice(0, 3),
      // Last stretch of a text thread that's escalating to voice. Trimmed to
      // the recent tail — enough to continue the thread, not the whole history.
      priorTurns: (Array.isArray(body.priorTurns) ? body.priorTurns : [])
        .filter(
          (t): t is { speaker: "user" | "assistant"; text: string } =>
            !!t && (t.speaker === "user" || t.speaker === "assistant") && typeof t.text === "string",
        )
        .slice(-12)
        .map((t) => ({ speaker: t.speaker, text: t.text.slice(0, 500) })),
    })

    const created = await getOpenAI().realtime.clientSecrets.create({
      expires_after: { anchor: "created_at", seconds: TOKEN_TTL_SECONDS },
      session: {
        type: "realtime",
        model: MODEL,
        instructions,
        audio: {
          input: {
            // Transcription is what the on-screen transcript and the whole
            // Phase 4 analysis are built on, so it is not optional here.
            //
            // `language` is deliberately omitted (auto-detect) rather than
            // pinned to "es": the parent code-switches, and pinning Spanish
            // makes the transcriber mangle the English words into Spanish-ish
            // nonsense. Those moments are exactly the gaps worth catching, so
            // mangling them would blind the Phase 4 analysis to them. Same
            // reasoning as `language=auto` on /api/transcribe for capture.
            transcription: { model: "gpt-4o-mini-transcribe" },
            // `eagerness: "low"` is the talking-over-the-learner fix. The
            // parent is a B1 speaker who pauses mid-sentence to find a word;
            // the default (auto = medium, ~4s max) reads that pause as a
            // finished turn and starts replying over them. `low` waits up to
            // ~8s when the utterance sounds unfinished, while a
            // complete-sounding sentence still gets a quick reply — semantic
            // VAD scores "do they sound done", not just silence length. If
            // low ever feels sluggish after a clearly finished turn, the next
            // lever is prompt-side ("wait for me"), not a fixed delay.
            turn_detection: { type: "semantic_vad", eagerness: "low" },
          },
          output: { voice },
        },
      },
    })

    posthog?.capture({
      distinctId: "server",
      event: "llm_call",
      properties: {
        type: "voice_session_mint",
        model: MODEL,
        voice,
        correction_level: correctionLevel,
        topic_id: body.topicId ?? null,
        pack_phrases: body.packPhrases?.length ?? 0,
        capture_lessons: body.captureLessons?.length ?? 0,
      },
    })

    return NextResponse.json(
      { clientSecret: created.value, model: MODEL, voice },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch (err) {
    console.error("[/api/voice/session]", err)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
