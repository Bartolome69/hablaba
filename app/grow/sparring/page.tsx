"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronLeft, Volume2, VolumeX } from "lucide-react"
import { toast } from "sonner"
import { usePostHog } from "posthog-js/react"
import { ChatBubble } from "@/components/chat/chat-bubble"
import { ChatInput } from "@/components/chat/chat-input"
import { playAudio } from "@/lib/audio"
import { useVoicePreference } from "@/hooks/use-voice-preference"
import type { CriarChild } from "@/lib/criar/types"
import { ensureSeeded } from "@/lib/criar/seed"
import { useSparring } from "@/lib/criar/use-sparring"

export default function SparringPage() {
  const [child, setChild] = useState<CriarChild | null>(null)
  const { voiceId } = useVoicePreference()
  const bottomRef = useRef<HTMLDivElement>(null)
  const posthog = usePostHog()

  useEffect(() => {
    setChild(ensureSeeded())
  }, [])

  // Auto-play the partner's turns by default, but let the parent mute it
  // (e.g. sleeping baby) — muting only silences auto-play; tap-to-hear on any
  // bubble still works. Preference persists across sessions.
  const MUTE_KEY = "criar_sparring_muted"
  const [muted, setMuted] = useState(false)
  const mutedRef = useRef(false)
  mutedRef.current = muted

  // TTS at page level, same shape as the main chat — but Rioplatense register
  const [playingId, setPlayingId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    setMuted(localStorage.getItem(MUTE_KEY) === "1")
  }, [])

  // Stop playback and cancel any in-flight TTS request. Stable identity so
  // the unmount effect below can tear down audio when the user leaves.
  const stopAudio = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
  }, [])

  const playTTS = useCallback(async (messageId: string, text: string) => {
    const wasPlaying = playingId === messageId
    stopAudio()
    if (wasPlaying) {
      setPlayingId(null)
      return
    }

    setPlayingId(messageId)
    const controller = new AbortController()
    abortRef.current = controller
    let url: string | null = null
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: voiceId, register: "rioplatense" }),
        signal: controller.signal,
      })
      if (!res.ok) throw new Error("TTS failed")
      const blob = await res.blob()
      url = URL.createObjectURL(blob)
      const audio = await playAudio(url, controller.signal)
      // Navigated away / muted / superseded while the clip was loading.
      if (controller.signal.aborted) {
        audio.pause()
        URL.revokeObjectURL(url)
        return
      }
      const objectUrl = url
      audioRef.current = audio
      audio.onended = () => {
        setPlayingId(null)
        URL.revokeObjectURL(objectUrl)
        audioRef.current = null
      }
    } catch {
      if (url) URL.revokeObjectURL(url)
      if (controller.signal.aborted) return // silent — user cancelled
      setPlayingId(null)
      toast.error("No se pudo reproducir el audio", {
        action: { label: "Retry", onClick: () => playTTS(messageId, text) },
      })
    }
  }, [voiceId, playingId, stopAudio])

  // Kill audio if the user navigates away from the conversation.
  useEffect(() => stopAudio, [stopAudio])

  // Gate for auto-play only; manual bubble taps call playTTS directly
  const autoPlay = useCallback((id: string, text: string) => {
    if (mutedRef.current) return
    playTTS(id, text)
  }, [playTTS])

  const toggleMuted = useCallback(() => {
    setMuted((prev) => {
      const next = !prev
      try {
        localStorage.setItem(MUTE_KEY, next ? "1" : "0")
      } catch {}
      // Silence anything playing or still loading when muting
      if (next) {
        stopAudio()
        setPlayingId(null)
      }
      posthog.capture("criar_sparring_mute_toggled", { muted: next })
      return next
    })
  }, [posthog, stopAudio])

  const { messages, isLoading, sendMessage } = useSparring(child, autoPlay)

  useEffect(() => {
    posthog.capture("criar_sparring_started")
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  // Scroll to bottom when the keyboard opens (see app/app/chat/page.tsx)
  useEffect(() => {
    const handler = () => {
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
      })
    }
    window.addEventListener("resize", handler)
    window.visualViewport?.addEventListener("resize", handler)
    return () => {
      window.removeEventListener("resize", handler)
      window.visualViewport?.removeEventListener("resize", handler)
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-background flex flex-col mx-auto max-w-lg">
      <header className="flex-shrink-0 bg-background border-b border-border">
        <div className="grid grid-cols-[auto_1fr_auto] items-center px-4 py-3">
          <Link
            href="/grow"
            aria-label="Back"
            className="flex items-center justify-center w-9 h-9 -ml-1.5 text-muted-foreground active:opacity-70 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="text-center">
            <p className="font-serif text-sm text-foreground">Sparring</p>
            <p className="text-xs text-muted-foreground">Your week, out loud · 5–10 min</p>
          </div>
          <button
            onClick={toggleMuted}
            aria-label={muted ? "Turn voice on" : "Mute voice"}
            aria-pressed={muted}
            className="flex items-center justify-center w-9 h-9 -mr-1.5 text-muted-foreground active:opacity-70 transition-opacity"
          >
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message) => (
          <ChatBubble
            key={message.id}
            message={message}
            isPlaying={playingId === message.id}
            onPlayRequest={() => playTTS(message.id, message.text)}
          />
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-secondary text-secondary-foreground rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-pulse [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-pulse [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-pulse [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex-shrink-0">
        <ChatInput
          onSend={sendMessage}
          onFocus={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
        />
      </div>
    </div>
  )
}
