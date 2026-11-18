"use client"

// The mic on "¿Cómo se dice?": tap OR hold, whichever the hand does.
//   - Hold: press opens the mic, release sends the clip.
//   - Tap: a quick press opens the mic and it stays open; tap again to send.
//     (It also stops on its own after MAX_MS.)
// A release that lands before the mic has even opened (the first-time
// permission prompt takes the finger away) counts as a tap, so the mic opens
// and waits instead of throwing the recording away. Until Nov 2026 the mic was
// hold-only and silently discarded anything under 350ms, so a plain tap, the
// most natural thing to do to a mic button, did nothing at all.
//
// Clips go to /api/transcribe with language auto, since questions come in
// English, Spanish or both. The press itself is the user gesture iOS needs
// before it will open the microphone.

import { useCallback, useEffect, useRef, useState } from "react"

export type RecorderState = "idle" | "opening" | "recording" | "transcribing"

/** A press shorter than this is a tap: the mic stays open until the next tap. */
const TAP_MS = 300
/** A recording shorter than this is an accident: discard rather than transcribe silence. */
const MIN_MS = 350
/** Hands-free recordings stop on their own after this long. */
const MAX_MS = 30_000

export function useRecorder(onText: (text: string) => void, onError: (kind: "denied" | "failed") => void) {
  const [state, setState] = useState<RecorderState>("idle")
  /** Recording hands-free after a tap (vs. held down): the UI says "tap to finish". */
  const [latched, setLatched] = useState(false)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const pressAtRef = useRef(0)
  const startedAtRef = useRef(0)
  const holdingRef = useRef(false)
  const openingRef = useRef(false)
  const discardRef = useRef(false)
  const unmountedRef = useRef(false)
  const limitRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onTextRef = useRef(onText)
  const onErrorRef = useRef(onError)
  useEffect(() => {
    onTextRef.current = onText
    onErrorRef.current = onError
  })

  // Decided after mount: the server can't know, and guessing during render
  // made the inline panels' markup differ between server and client.
  const [supported, setSupported] = useState(false)
  useEffect(() => {
    setSupported(!!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined")
  }, [])

  const finish = useCallback(() => {
    if (limitRef.current) clearTimeout(limitRef.current)
    limitRef.current = null
    const recorder = recorderRef.current
    recorderRef.current = null
    setLatched(false)
    if (recorder && recorder.state === "recording") recorder.stop()
  }, [])

  /** Pointer down on the mic. */
  const press = useCallback(async () => {
    if (!supported || openingRef.current) return
    // Already listening hands-free: this tap is the "done".
    if (recorderRef.current?.state === "recording") {
      finish()
      return
    }
    if (state === "transcribing") return
    pressAtRef.current = Date.now()
    holdingRef.current = true
    openingRef.current = true
    discardRef.current = false
    setState("opening")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (unmountedRef.current) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }
      streamRef.current = stream
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data)
      }
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        streamRef.current = null
        const elapsed = Date.now() - startedAtRef.current
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" })
        if (discardRef.current || elapsed < MIN_MS || blob.size === 0) {
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
          if (text?.trim()) onTextRef.current(text.trim())
          else onErrorRef.current("failed")
        } catch {
          onErrorRef.current("failed")
        } finally {
          setState("idle")
        }
      }
      recorderRef.current = recorder
      startedAtRef.current = Date.now()
      recorder.start()
      setState("recording")
      limitRef.current = setTimeout(finish, MAX_MS)
      // Released while the mic was still opening (a tap, or the permission
      // prompt took the finger away): keep listening until the next tap.
      if (!holdingRef.current) setLatched(true)
    } catch (err) {
      setState("idle")
      onErrorRef.current(err instanceof DOMException && err.name === "NotAllowedError" ? "denied" : "failed")
    } finally {
      openingRef.current = false
    }
  }, [state, supported, finish])

  /** Pointer up (or cancelled). A quick press latches; a hold sends. */
  const release = useCallback(() => {
    if (!holdingRef.current) return
    holdingRef.current = false
    const recorder = recorderRef.current
    if (!recorder || recorder.state !== "recording") return // still opening: latches when it opens
    if (Date.now() - pressAtRef.current < TAP_MS) {
      setLatched(true)
      return
    }
    finish()
  }, [finish])

  // Leaving (the sheet closes mid-recording): let go of the mic, send nothing.
  useEffect(
    () => () => {
      unmountedRef.current = true
      discardRef.current = true
      if (limitRef.current) clearTimeout(limitRef.current)
      const recorder = recorderRef.current
      if (recorder && recorder.state === "recording") recorder.stop()
      streamRef.current?.getTracks().forEach((t) => t.stop())
    },
    [],
  )

  return { state, latched, press, release, supported }
}
