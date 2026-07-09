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

export function useRecorder(
  onTranscript: (text: string) => void,
  opts?: { language?: "es" | "auto" },
) {
  const language = opts?.language ?? "es"
  const [state, setState] = useState<RecorderState>("idle")
  const [error, setError] = useState<string | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)

  const cleanup = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    recorderRef.current = null
    chunksRef.current = []
    analyserRef.current = null
    audioCtxRef.current?.close().catch(() => {})
    audioCtxRef.current = null
  }, [])

  const getLevels = useCallback((bars: number): number[] => {
    const analyser = analyserRef.current
    const out = new Array(bars).fill(0)
    if (!analyser) return out
    const data = new Uint8Array(analyser.frequencyBinCount)
    analyser.getByteFrequencyData(data)
    // Voice range: skip the lowest bin (mostly noise) and use ~80 Hz – 5 kHz
    const start = 1
    const end = Math.min(32, data.length)
    const binsPerBar = Math.max(1, Math.floor((end - start) / bars))
    for (let i = 0; i < bars; i++) {
      let sum = 0
      for (let j = 0; j < binsPerBar; j++) {
        sum += data[start + i * binsPerBar + j] ?? 0
      }
      out[i] = sum / binsPerBar / 255
    }
    return out
  }, [])

  useEffect(() => cleanup, [cleanup])

  const start = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const AudioContextClass =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (AudioContextClass) {
        const ctx = new AudioContextClass()
        const source = ctx.createMediaStreamSource(stream)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 256
        analyser.smoothingTimeConstant = 0.6
        source.connect(analyser)
        audioCtxRef.current = ctx
        analyserRef.current = analyser
      }
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
          form.append("language", language)
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
  }, [cleanup, onTranscript, language])

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

  return { state, error, start, stop, cancel, getLevels }
}
