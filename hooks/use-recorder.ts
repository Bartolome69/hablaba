"use client"

import { useCallback, useEffect, useRef, useState } from "react"

type RecorderState = "idle" | "recording" | "transcribing"

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/mpeg"]
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type
  }
  return undefined
}

function extensionFor(mime: string | undefined): string {
  if (!mime) return "webm"
  if (mime.includes("mp4")) return "mp4"
  if (mime.includes("mpeg")) return "mp3"
  return "webm"
}

export function useRecorder(onTranscript: (text: string) => void) {
  const [state, setState] = useState<RecorderState>("idle")
  const [error, setError] = useState<string | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  const cleanup = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    recorderRef.current = null
    chunksRef.current = []
  }, [])

  useEffect(() => cleanup, [cleanup])

  const start = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mimeType = pickMimeType()
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = async () => {
        const mime = recorder.mimeType || mimeType || "audio/webm"
        const blob = new Blob(chunksRef.current, { type: mime })
        cleanup()
        if (blob.size === 0) {
          setState("idle")
          return
        }
        setState("transcribing")
        try {
          const form = new FormData()
          form.append("audio", blob, `audio.${extensionFor(mime)}`)
          const res = await fetch("/api/transcribe", { method: "POST", body: form })
          if (!res.ok) throw new Error("Transcription failed")
          const data: { text?: string } = await res.json()
          if (data.text?.trim()) onTranscript(data.text.trim())
        } catch (err) {
          console.error(err)
          setError("No se pudo transcribir el audio")
        } finally {
          setState("idle")
        }
      }
      recorderRef.current = recorder
      recorder.start()
      setState("recording")
    } catch (err) {
      const name = err instanceof DOMException ? err.name : ""
      if (name === "NotAllowedError") {
        setError("Microphone access blocked. Enable it in your browser settings.")
      } else if (name === "NotFoundError") {
        setError("No microphone found.")
      } else {
        console.error(err)
        setError("Could not start recording.")
      }
      setState("idle")
      cleanup()
    }
  }, [cleanup, onTranscript])

  const stop = useCallback(() => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop()
    }
  }, [])

  const cancel = useCallback(() => {
    if (recorderRef.current?.state === "recording") {
      chunksRef.current = []
      recorderRef.current.stop()
    }
    cleanup()
    setState("idle")
  }, [cleanup])

  return { state, error, start, stop, cancel }
}
