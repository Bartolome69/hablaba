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
import { ArrowLeft, AudioLines, MicOff, RotateCcw, WifiOff } from "lucide-react"
import { toast } from "sonner"
import { usePostHog } from "posthog-js/react"
import { ChatInput } from "@/components/chat/chat-input"
import { ConversationTranscript } from "@/components/conversations/conversation-transcript"
import { SessionReview } from "@/components/voice/session-review"
import { VoiceOrb } from "@/components/voice/voice-orb"
import { assembleFocusAreas } from "@/lib/conversations/focus"
import { getConversationSeedPhrases } from "@/lib/phrases/pack"
import { addPhrase, markSeeded } from "@/lib/phrases/store"
import { describeAge, getProfile } from "@/lib/profile/store"
import { ensureConversationAnalysis } from "@/lib/conversations/analysis"
import { conversationVoicePersistence } from "@/lib/conversations/persistence"
import { getConversation, listTurns } from "@/lib/conversations/store"
import type { Conversation, ConversationTurn } from "@/lib/conversations/types"
import { useConversation } from "@/lib/conversations/use-conversation"
import {
  MAX_SESSION_SECONDS,
  nextOutputGain,
  OUTPUT_GAIN_KEY,
  SESSION_WARNING_SECONDS,
} from "@/lib/voice/config"
import { micPermissionHelp } from "@/lib/voice/platform"
import { useMediaSession } from "@/lib/voice/use-media-session"
import { useVoiceSession } from "@/lib/voice/use-voice-session"
import { useWakeLock } from "@/lib/voice/use-wake-lock"
import { getVoiceTopic } from "@/lib/voice-topics"

export default function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [outputGainPref, setOutputGainPref] = useState<number | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const posthog = usePostHog()

  const { turns, isLoading, sendMessage, reload } = useConversation(
    loaded && conversation ? id : null,
    conversation?.title,
    conversation?.starterId ?? undefined,
  )

  const persistence = useMemo(() => conversationVoicePersistence(id), [id])
  const voice = useVoiceSession(persistence, "/api/voice/session")

  const inVoice = voice.state !== "idle" && voice.state !== "ended"
  useWakeLock(voice.state === "live" || voice.state === "paused")
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
    void ensureConversationAnalysis(id).catch(() => {})
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
    const profile = getProfile()
    // Seed the working set: she weaves these in, and seeding is the state
    // transition nueva → practicando.
    const seedPhrases = getConversationSeedPhrases()
    markSeeded(seedPhrases.map((p) => p.id))
    posthog.capture("conversation_voice_started", {
      prior_turns: priorTurns.length,
      seed_phrases: seedPhrases.length,
    })
    void voice.start({
      childName: profile.child?.name ?? "",
      ageDescription: profile.child?.birthdate ? describeAge(profile.child.birthdate) : "",
      packPhrases: seedPhrases.map((p) => p.text),
      captureLessons: seedPhrases
        .filter((p) => p.source === "captured")
        .map((p) => ({ request: p.translation, spanish: p.text })),
      correctionLevel: profile.correctionLevel,
      dialect: profile.dialect,
      topicId: conversation.starterId ?? undefined,
      focusAreas: assembleFocusAreas(),
      priorTurns,
    })
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

  // In-flight voice turns aren't in the store yet — append them for display only.
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

  if (!loaded) return <div className="min-h-dvh bg-background" />

  if (!conversation) {
    return (
      <div className="min-h-dvh bg-background px-4 py-6">
        <p className="text-sm text-muted-foreground">No encontramos esa charla.</p>
        <Link href="/app/charla" className="mt-2 inline-block text-sm font-medium text-primary">
          ← Volver a Charlar
        </Link>
      </div>
    )
  }

  const topic = conversation.starterId ? getVoiceTopic(conversation.starterId) : null

  return (
    <div className="fixed inset-0 mx-auto flex max-w-lg flex-col bg-background">
      <header className="flex flex-shrink-0 items-center gap-3 px-4 pt-6 pb-3">
        <Link
          href="/app/charla"
          aria-label="Volver a Charlar"
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-all hover:text-foreground active:scale-[0.98]"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-serif text-lg font-semibold text-foreground">
            {conversation.emoji} {conversation.title}
          </h1>
          <p className="text-xs text-muted-foreground">
            {conversation.voiceSeconds > 0
              ? `${Math.max(1, Math.round(conversation.voiceSeconds / 60))} min en voz alta`
              : topic?.blurb ?? "Escribí o hablá"}
          </p>
        </div>
      </header>

      {voice.state === "interrupted" && (
        <div className="mx-4 mb-2 flex items-start gap-3 rounded-xl bg-amber-500/10 px-4 py-3">
          <WifiOff className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-500" />
          <p className="text-sm leading-relaxed text-foreground text-pretty">
            La conversación se pausó cuando saliste de la pantalla. Todo quedó guardado acá.
          </p>
        </div>
      )}

      {voice.state === "error" && voice.error && (
        <div className="mx-4 mb-2 flex items-start gap-3 rounded-xl bg-destructive/10 px-4 py-3">
          {voice.error.kind === "mic-denied" ? (
            <MicOff className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
          ) : (
            <RotateCcw className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
          )}
          <div className="text-sm leading-relaxed text-foreground text-pretty">
            <p>{voice.error.message}</p>
            {voice.error.kind === "mic-denied" && (
              <p className="mt-1 text-muted-foreground">{micPermissionHelp()}</p>
            )}
          </div>
        </div>
      )}

      {nearLimit && (
        <p className="mx-4 mb-2 text-center text-xs font-medium text-amber-600 dark:text-amber-500">
          Estamos por cerrar la parte hablada — ya casi llegamos a los 15 minutos.
        </p>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-2">
        {/* The review covers the whole thread, so it sits at the end of it. */}
        <ConversationTranscript
          turns={displayTurns}
          onSavePhrase={(spanish, english) => {
            addPhrase({ text: spanish, translation: english, source: "saved" })
            toast.success("Guardada")
          }}
        />

        {isLoading && (
          <div className="mt-4 flex justify-start">
            <div className="rounded-2xl rounded-bl-md bg-secondary px-4 py-3">
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:300ms]" />
              </div>
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

      {/* One composer area: type, or hand the thread over to your voice. */}
      <div className="flex-shrink-0 border-t border-border">
        {inVoice ? (
          <VoiceOrb
            state={voice.state}
            userSpeaking={voice.userSpeaking}
            elapsed={voice.elapsed}
            nearLimit={nearLimit}
            onStart={startVoice}
            onPause={voice.pause}
            onResume={voice.resume}
            onStop={voice.stop}
            outputGain={voice.outputGain}
            onCycleGain={cycleGain}
          />
        ) : (
          <div className="flex items-end gap-2 pr-3">
            <div className="min-w-0 flex-1">
              <ChatInput
                onSend={sendMessage}
                onFocus={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
              />
            </div>
            {/* AudioLines, not a mic: a mic reads as "dictate into the text
                box" (which keyboard dictation covers); the waveform means
                "switch this thread to a live spoken conversation". */}
            <button
              onClick={startVoice}
              aria-label="Seguir en voz alta"
              className="mb-3 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform active:scale-[0.96]"
            >
              <AudioLines className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
