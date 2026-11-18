"use client"

// One conversation, both modalities. Type at the kitchen table, tap the mic and
// keep the same thread going out loud, come back and type again — one history,
// one review.
//
// Corrections split by modality on purpose: typed turns carry them inline
// (you're looking at the screen), spoken turns defer everything to the review
// below (the phone is in a pocket, and the spoken recast already taught it).

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { usePostHog } from "posthog-js/react"
import { ChatInput } from "@/components/chat/chat-input"
import { ConversationTranscript } from "@/components/conversations/conversation-transcript"
import { DuoIcon } from "@/components/icons"
import { SessionReview } from "@/components/voice/session-review"
import { SettingsSheet } from "@/components/settings-sheet"
import { PocketView } from "@/components/voice/pocket-view"
import { VoiceOrb } from "@/components/voice/voice-orb"
import { useTTS } from "@/hooks/use-tts"
import { useReadAloud } from "@/hooks/use-read-aloud"
import { assembleFocusAreas } from "@/lib/conversations/focus"
import { addPhrase } from "@/lib/phrases/store"
import { ensureConversationAnalysis } from "@/lib/conversations/analysis"
import { buildSeed } from "@/lib/conversations/seed"
import { PARTNER_NAME } from "@/lib/voices"
import { conversationVoicePersistence } from "@/lib/conversations/persistence"
import { getConversation, listObservations, listTurns } from "@/lib/conversations/store"
import type { Conversation, ConversationTurn } from "@/lib/conversations/types"
import { useConversation } from "@/lib/conversations/use-conversation"
import {
  MAX_SESSION_SECONDS,
  nextOutputGain,
  OUTPUT_GAIN_KEY,
  SESSION_WARNING_SECONDS,
} from "@/lib/voice/config"
import { isIOS, micPermissionHelp } from "@/lib/voice/platform"
import { useMediaSession } from "@/lib/voice/use-media-session"
import { useVoiceSession } from "@/lib/voice/use-voice-session"
import { useWakeLock } from "@/lib/voice/use-wake-lock"
import { getVoiceTopic } from "@/lib/voice-topics"

export default function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [outputGainPref, setOutputGainPref] = useState<number | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const posthog = usePostHog()
  const { play, playingId } = useTTS("chat")
  const { readAloud } = useReadAloud()

  // Read through refs, not closure: the callback fires when a reply lands, so
  // it must see the setting and the voice state AT THAT MOMENT, not whatever
  // they were on the render that created it.
  const readAloudRef = useRef(readAloud)
  readAloudRef.current = readAloud
  const inVoiceRef = useRef(false)

  const speakIfReadAloud = useCallback(
    (turn: ConversationTurn) => {
      // Voice mode is already speaking her, so reading the same turn aloud
      // would play two of her at once. The composer is hidden whenever a
      // session is up, so there's no route to this today — it's here because
      // the callback is async (state can move between send and reply) and
      // because the day someone loosens that visibility rule, the failure is
      // duplicated audio, which is both awful and easy to miss in review.
      if (!readAloudRef.current || inVoiceRef.current) return
      void play(turn.id, turn.text)
    },
    [play],
  )

  const { turns, isLoading, sendMessage, reload } = useConversation(
    loaded && conversation ? id : null,
    conversation?.title,
    conversation?.starterId ?? undefined,
    speakIfReadAloud,
  )

  const persistence = useMemo(() => conversationVoicePersistence(id), [id])
  const voice = useVoiceSession(persistence, "/api/voice/session")

  const inVoice = voice.state !== "idle" && voice.state !== "ended"
  inVoiceRef.current = inVoice

  // Phase 4: turns where the analysis found a saved phrase used naturally,
  // as turnId → what the parent said. Shown as a quiet note under the turn.
  const [usedNotes, setUsedNotes] = useState<Record<string, string>>({})
  const loadNotes = useCallback(() => {
    const notes: Record<string, string> = {}
    for (const o of listObservations(id)) {
      if (o.type === "target_phrase_used" && o.turnId && o.detail.original) notes[o.turnId] = o.detail.original
    }
    setUsedNotes(notes)
  }, [id])
  useEffect(() => loadNotes(), [loadNotes])

  // Typed threads get analysed too (Phase 4): when the parent leaves the
  // thread or the app goes to the background, if there are typed turns the
  // review hasn't seen. Never mid-voice; voice has its own end-of-session run.
  useEffect(() => {
    const maybeAnalyze = () => {
      if (inVoiceRef.current) return
      const c = getConversation(id)
      if (!c || c.analyzedAt) return
      if (!listTurns(id).some((t) => t.speaker === "user" && t.modality === "text")) return
      void ensureConversationAnalysis(id).then(loadNotes).catch(() => {})
    }
    const onVisibility = () => {
      if (document.visibilityState === "hidden") maybeAnalyze()
    }
    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("pagehide", maybeAnalyze)
    return () => {
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("pagehide", maybeAnalyze)
      maybeAnalyze()
    }
  }, [id, loadNotes])
  const talking = voice.state === "live" || voice.state === "paused"
  const wakeLock = useWakeLock(talking)

  // The pocket view (Phase 6). On iPhone it opens by itself the first time a
  // session goes live with the screen held on: the screen has to stay on
  // there, so it may as well be dark with two big controls. Elsewhere it's
  // one tap away ("Modo bolsillo"). Closing it is respected until the next
  // spoken stretch.
  const [ios, setIos] = useState(false)
  const [pocket, setPocket] = useState(false)
  const autoPocketDone = useRef(false)
  useEffect(() => {
    if (!inVoice) {
      setPocket(false)
      autoPocketDone.current = false
      return
    }
    if (ios && wakeLock === "held" && voice.state === "live" && !autoPocketDone.current) {
      autoPocketDone.current = true
      setPocket(true)
    }
  }, [inVoice, ios, wakeLock, voice.state])

  // What to say about the screen. Only iPhone needs a note: there a locked
  // screen pauses the conversation, so we promise only what's true.
  const screenNote = !ios || !talking
    ? undefined
    : wakeLock === "held"
      ? "En iPhone la pantalla tiene que quedar prendida. La dejamos prendida por ti."
      : wakeLock === "off"
        ? undefined
        : "Este iPhone no nos deja mantener la pantalla prendida. Si se apaga, la charla se pausa: tócala de vez en cuando."
  useMediaSession({
    active: voice.state === "live" || voice.state === "paused",
    paused: voice.state === "paused",
    onPause: voice.pause,
    onResume: voice.resume,
    onStop: voice.stop,
  })

  // localStorage is client-only — load after mount to avoid hydration mismatch
  useEffect(() => {
    setConversation(getConversation(id))
    setIos(isIOS())
    try {
      const gain = Number(localStorage.getItem(OUTPUT_GAIN_KEY))
      if (Number.isFinite(gain) && gain >= 1) setOutputGainPref(gain)
    } catch {}
    setLoaded(true)
  }, [id])

  useEffect(() => {
    if (outputGainPref != null) voice.setOutputGain(outputGainPref)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outputGainPref])

  // Voice turns are persisted as they finalise, so re-read the thread whenever
  // the engine reports movement — that keeps one ordered transcript rather than
  // two lists to reconcile.
  useEffect(() => {
    if (voice.turns.length) reload()
  }, [voice.turns, reload])

  // On ending a spoken stretch: refresh the thread and kick the review.
  useEffect(() => {
    if (voice.state !== "ended" && voice.state !== "interrupted") return
    reload()
    setConversation(getConversation(id))
    void ensureConversationAnalysis(id).then(loadNotes).catch(() => {})
    posthog.capture("conversation_voice_ended", { duration_seconds: voice.elapsed })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.state, id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [turns, voice.turns, isLoading])

  const startVoice = useCallback(() => {
    if (!conversation) return
    const priorTurns = listTurns(id)
      .slice(-12)
      .map((t) => ({ speaker: t.speaker, text: t.text }))
    // Seed the working set (phrases, and the words they've been reviewing):
    // she weaves these in, and seeding moves the phrases nueva → practicando.
    const seed = buildSeed(conversation.starterId ?? undefined)
    posthog.capture("conversation_voice_started", {
      prior_turns: priorTurns.length,
      seed_phrases: seed.packPhrases.length,
      seed_words: seed.seedWords?.length ?? 0,
    })
    void voice.start({ ...seed, focusAreas: assembleFocusAreas(), priorTurns })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation, id])

  const cycleGain = useCallback(() => {
    const next = nextOutputGain(voice.outputGain)
    voice.setOutputGain(next)
    try {
      localStorage.setItem(OUTPUT_GAIN_KEY, String(next))
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.outputGain])

  const nearLimit =
    voice.state === "live" && MAX_SESSION_SECONDS - voice.elapsed <= SESSION_WARNING_SECONDS

  // In-flight voice turns aren't in the store yet — append finalised-looking
  // partials for display; the parent's own in-progress words feed the console's
  // live caption bar instead of the transcript.
  const displayTurns: ConversationTurn[] = useMemo(() => {
    const stored = new Set(turns.map((t) => t.id))
    const partials = voice.turns
      .filter((t) => !t.final && !stored.has(t.id) && t.text.trim())
      .map((t, i) => ({
        id: t.id,
        conversationId: id,
        speaker: t.speaker,
        modality: "voice" as const,
        text: t.text,
        createdAt: t.startedAt,
        ordinal: Number.MAX_SAFE_INTEGER - 100 + i,
      }))
    return [...turns, ...partials]
  }, [turns, voice.turns, id])

  // What the mic is hearing right now — the console's live caption.
  const liveCaption = useMemo(() => {
    const partial = [...voice.turns].reverse().find((t) => t.speaker === "user" && !t.final)
    return partial?.text?.trim() || undefined
  }, [voice.turns])

  if (!loaded) return <div className="min-h-dvh bg-background" />

  if (!conversation) {
    return (
      <div className="min-h-dvh bg-background px-[22px] py-6">
        <p className="text-sm text-ink-muted">No encontramos esa charla.</p>
        <Link href="/app/charla" className="mt-2 inline-block text-sm font-medium text-green">
          ← Volver a Charlar
        </Link>
      </div>
    )
  }

  const topic = conversation.starterId ? getVoiceTopic(conversation.starterId) : null
  const voiceMinutes = Math.max(1, Math.round(conversation.voiceSeconds / 60))

  return (
    <div className="fixed inset-0 mx-auto flex max-w-lg flex-col bg-background">
      <header className="flex flex-shrink-0 items-center gap-3 border-b border-rule px-5 pb-3.5 pt-6">
        <Link
          href="/app/charla"
          aria-label="Volver a Charlar"
          className="clay-card flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[13px] text-ink"
        >
          <DuoIcon name="volver" size={18} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[15px] font-semibold text-ink">{conversation.title}</h1>
          {inVoice && (voice.state === "live" || voice.state === "paused") ? (
            <p className="flex items-center gap-1.5 text-xs text-ink-muted">
              <span
                aria-hidden
                className={`h-1.5 w-1.5 rounded-full ${voice.state === "live" ? "bg-green" : "bg-ink-faint"}`}
              />
              {voice.state === "live" ? "En línea" : "En pausa"}
              {" · "}
              {Math.max(1, Math.ceil(voice.elapsed / 60))} min en voz alta
            </p>
          ) : (
            <p className="truncate text-xs text-ink-muted">
              {conversation.voiceSeconds > 0
                ? `${voiceMinutes} min en voz alta`
                : topic?.blurb ?? "Escribe o habla"}
            </p>
          )}
        </div>
        <button
          onClick={() => setSheetOpen(true)}
          aria-label="Ajustes"
          className="press-disc flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[13px] bg-green-tint text-green"
        >
          <DuoIcon name="overflow" size={18} />
        </button>
      </header>

      {voice.state === "interrupted" && (
        <div className="mx-5 mt-3 flex items-start gap-3 rounded-2xl bg-sunken px-4 py-3">
          <DuoIcon name="pausa" size={16} className="mt-0.5 flex-shrink-0 text-ink" />
          <p className="text-sm leading-relaxed text-ink text-pretty">
            La conversación se pausó cuando saliste de la pantalla.
            {ios && " En iPhone pasa si la pantalla se apaga o cambias de app."} Todo quedó guardado acá.
          </p>
        </div>
      )}

      {voice.state === "error" && voice.error && (
        <div className="mx-5 mt-3 flex items-start gap-3 rounded-2xl bg-terracotta-tint px-4 py-3">
          <DuoIcon name={voice.error.kind === "mic-denied" ? "micro" : "repasar"} size={16} className="mt-0.5 flex-shrink-0 text-terracotta-ink" detail="#8A4527" />
          <div className="text-sm leading-relaxed text-terracotta-ink text-pretty">
            <p>{voice.error.message}</p>
            {voice.error.kind === "mic-denied" && (
              <p className="mt-1 text-terracotta-ink">{micPermissionHelp()}</p>
            )}
          </div>
        </div>
      )}

      {screenNote && (
        <p
          className={`mx-5 mt-2 text-center text-xs leading-snug ${
            wakeLock === "held" ? "text-ink-muted" : "font-medium text-terracotta-ink"
          }`}
        >
          {screenNote}
        </p>
      )}

      {nearLimit && (
        <p className="mx-5 mt-2 text-center text-xs font-medium text-terracotta-ink">
          Estamos por cerrar la parte hablada: ya casi llegamos a los 15 minutos.
        </p>
      )}

      {/* Bottom-anchored transcript: the newest turn always sits directly
          above the composer, fading out under the header. */}
      <div className="fade-top flex-1 overflow-y-auto px-5 py-4">
        <div className="flex min-h-full flex-col justify-end">
          {/* The review covers the whole thread, so it sits at the end of it. */}
          <ConversationTranscript
            turns={displayTurns}
            playingId={playingId}
            /* No tap-to-replay while she's live on the mic. It played a
               SEPARATE tts clip over the top of her Realtime voice — two of
               her at once — and the open mic then heard the clip, took it for
               the parent's turn, and had her answer herself. In a live
               conversation the way to hear something again is to ask her, out
               loud, which is what hands-free is for; the text is on screen
               either way. The chip comes back the moment the session ends. */
            onPlayRequest={inVoice ? undefined : play}
            /* The "phrase used" notes wait until the spoken stretch is over. */
            usedNotes={inVoice ? undefined : usedNotes}
            onSavePhrase={(spanish, english) => {
              addPhrase({ text: spanish, translation: english, source: "saved" })
              toast.success("Guardada")
            }}
          />

          {isLoading && (
            <div className="mt-4 flex justify-start">
              <div
                className="flex items-center gap-[9px] rounded-[20px] rounded-bl-[7px] bg-surface px-[15px] py-[11px]"
                style={{ boxShadow: "inset 0 0 0 1px rgba(30,61,44,.07)" }}
              >
                <span className="flex h-3.5 items-end gap-[3px]" aria-hidden>
                  <span className="anim-bar h-3.5 w-[3px] rounded-[2px] bg-green opacity-45" />
                  <span className="anim-bar h-3.5 w-[3px] rounded-[2px] bg-green opacity-70 [animation-delay:140ms]" />
                  <span className="anim-bar h-3.5 w-[3px] rounded-[2px] bg-terracotta [animation-delay:280ms]" />
                </span>
                <span className="text-[12.5px] text-ink-muted">{PARTNER_NAME} está pensando…</span>
              </div>
            </div>
          )}

          {(voice.state === "ended" || voice.state === "interrupted") &&
            conversation.voiceSeconds > 0 && (
              <div className="mt-6">
                <SessionReview sessionId={id} analyze={ensureConversationAnalysis} />
              </div>
            )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* One composer area: type, or hand the thread over to your voice. */}
      <div className="flex-shrink-0 border-t border-rule bg-background">
        {inVoice ? (
          <VoiceOrb
            state={voice.state}
            userSpeaking={voice.userSpeaking}
            caption={liveCaption}
            elapsed={voice.elapsed}
            nearLimit={nearLimit}
            onStart={startVoice}
            onPause={voice.pause}
            onResume={voice.resume}
            onStop={voice.stop}
            outputGain={voice.outputGain}
            onCycleGain={cycleGain}
            onPocket={() => setPocket(true)}
          />
        ) : (
          <div className="px-5 pt-3.5" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1.5rem)" }}>
            {/* One action slot: "Hablar" hands the thread to your voice; once
                you type, it's the send arrow. */}
            <ChatInput
              onSend={sendMessage}
              onVoice={startVoice}
              onFocus={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
            />
          </div>
        )}
      </div>

      <SettingsSheet open={sheetOpen} onOpenChange={setSheetOpen} />

      {pocket && talking && (
        <PocketView
          state={voice.state}
          elapsed={voice.elapsed}
          userSpeaking={voice.userSpeaking}
          screenNote={screenNote}
          onPause={voice.pause}
          onResume={voice.resume}
          onStop={voice.stop}
          onExit={() => setPocket(false)}
        />
      )}
    </div>
  )
}
