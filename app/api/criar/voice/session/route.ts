import { NextResponse } from "next/server"
import { getOpenAI } from "@/lib/openai"
import { posthog } from "@/lib/posthog-server"
import { TOKEN_TTL_SECONDS } from "@/lib/criar/voice/config"

// Mints a short-lived OpenAI Realtime client secret for the browser.
//
// Why this route exists at all: the browser needs to speak WebRTC directly to
// OpenAI, but must never see OPENAI_API_KEY. It gets an `ek_…` secret instead,
// which expires in TOKEN_TTL_SECONDS and only covers opening a session.
//
// Cost posture: like every other route in this app there is no auth to check
// (Hablaba has no user concept yet), so the guardrails here are structural
// rather than identity-based — a short credential TTL, and model/voice/
// instructions fixed server-side so a caller cannot ask for a pricier model.
// The session-length cap lives on the client (see MAX_SESSION_SECONDS); this
// route cannot enforce it, because a session outlives the secret that opened
// it. If this ever ships publicly it wants a real rate limit in front of it.

export const runtime = "nodejs"

const MODEL = "gpt-realtime"

// Realtime's own voice set, separate from the `lib/voices.ts` TTS voices used
// elsewhere in the app. "marin" is the warmest of the current set; the porteño
// accent comes from the instructions, not the voice id.
const VOICE = "marin"

// Phase 1 placeholder. Phase 2 replaces this with buildVoiceInstructions() in
// lib/criar/prompts.ts, carrying the register flag, the correction level, and
// today's pack + captured phrases as conversation material.
const PLACEHOLDER_INSTRUCTIONS = `Sos un compañero de conversación argentino, cálido y paciente, charlando con una madre o padre que está criando a un bebé y aprendiendo español. Su nivel es B1.

REGISTRO: hablá español argentino usando tú (no voseo), igual que el resto de la app: "tú tienes", "¿qué haces?", "cuéntame", "mira". Nunca uses vosotros ni formas peninsulares ("vale", "guay", "coger"). Mantené el vocabulario y la calidez argentina: pañal, chupete, upa, mamadera, cochecito, "dale", "che", "qué lindo", "re". Acento porteño.

Tu trabajo es que hable ella o él, no vos. Turnos cortos: una o dos oraciones, y siempre terminá con una pregunta sobre su día con el bebé. Nunca uses emojis. Si se traba, ayudá con la palabra y seguí la conversación sin cortar el ritmo.

Está aprendiendo: a veces necesita unos segundos para armar la oración. Si te llega una frase a medio terminar, no la des por cerrada ni cambies de tema — decí algo mínimo ("ajá", "claro", o la palabra que le falta) y dejá que la termine.`

export async function POST() {
  try {
    const created = await getOpenAI().realtime.clientSecrets.create({
      expires_after: { anchor: "created_at", seconds: TOKEN_TTL_SECONDS },
      session: {
        type: "realtime",
        model: MODEL,
        instructions: PLACEHOLDER_INSTRUCTIONS,
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
          output: { voice: VOICE },
        },
      },
    })

    posthog?.capture({
      distinctId: "server",
      event: "llm_call",
      properties: { type: "criar_voice_session_mint", model: MODEL, voice: VOICE },
    })

    return NextResponse.json(
      { clientSecret: created.value, model: MODEL, voice: VOICE },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch (err) {
    console.error("[/api/criar/voice/session]", err)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
