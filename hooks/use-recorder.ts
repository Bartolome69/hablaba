"use client"

// Hold to speak: press starts the mic, release sends the clip to
// /api/transcribe (language auto, since "¿Cómo se dice?" questions come in
// English, Spanish or both). The press itself is the user gesture iOS needs
// before it will open the microphone.

import { useCallback, useEffect, useRef, useState } from "react"

export type RecorderState = "idle" | "recording" | "transcribing"

/** Shorter than this is a tap, not speech: discard rather than transcribe silence. */
const MIN_MS = 350

export function useRecorder(onText: (text: string) => void, onError: (kind: "denied" | "failed") => void) {
  const [state, setState] = useState<RecorderState>("idle")
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startedAtRef = useRef(0)
  const wantStopRef = useRef(false)

  // Decided after mount: the server can't know, and guessing during render
  // made the inline panels' markup differ between server and client.
  const [supported, setSupported] = useState(false)
  useEffect(() => {
    setSupported(!!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined")
  }, [])

  const start = useCallback(async () => {
    if (state !== "idle" || !supported) return
    wantStopRef.current = false
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data)
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const elapsed = Date.now() - startedAtRef.current
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" })
        if (elapsed < MIN_MS || blob.size === 0) {
          setState("idle")
          return
        }
        setState("transcribing")
        try {
          const ext = blob.type.includes("mp4") ? "m4a" : blob.type.includes("ogg") ? "ogg" : "webm"
          const form = new FormData()
          form.append("audio", new File([blob], `ask.${ext}`, { type: blob.type }))
          form.append("language", "auto")
          const res = await fetch("/api/transcribe", { method: "POST", body: form })
          if (!res.ok) throw new Error(`transcribe ${res.status}`)
          const { text } = (await res.json()) as { text?: string }
          if (text?.trim()) onText(text.trim())
        } catch {
          onError("failed")
        } finally {
          setState("idle")
        }
      }
      recorderRef.current = recorder
      startedAtRef.current = Date.now()
      recorder.start()
      setState("recording")
      // Released before the mic finished opening: stop straight away.
      if (wantStopRef.current) recorder.stop()
    } catch (err) {
      setState("idle")
      onError(err instanceof DOMException && err.name === "NotAllowedError" ? "denied" : "failed")
    }
  }, [state, supported, onText, onError])

  const stop = useCallback(() => {
    wantStopRef.current = true
    const recorder = recorderRef.current
    if (recorder && recorder.state === "recording") recorder.stop()
    recorderRef.current = null
  }, [])

  return { state, start, stop, supported }
}
