"use client"

// Elena reading a word or a page, cached on the device (IndexedDB) so each
// clip is paid for once and plays again with no network. Sound only ever
// starts from a tap (CLAUDE.md: read-aloud is opt-in).
//
// Offline with nothing cached: the phone's own Spanish voice if it has one
// (speechSynthesis), else a plain "no audio" result for the screen to show.

import { getAudio, pageAudioKey, putAudio, wordAudioKey } from "./blobs"
import type { SpanishDialect } from "./types"

export type PlayResult = { kind: "audio"; audio: HTMLAudioElement; url: string } | { kind: "device" } | { kind: "none" }

async function fetchClip(text: string, dialect: SpanishDialect): Promise<Blob> {
  // POST: a page is too long for a URL. Same route, voice and manner as Frases.
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, dialect, manner: "clear" }),
  })
  if (!res.ok) throw new Error(`tts ${res.status}`)
  return res.blob()
}

async function clipFor(key: string, text: string, dialect: SpanishDialect): Promise<Blob | null> {
  const cached = await getAudio(key).catch(() => null)
  if (cached) return cached
  try {
    const clip = await fetchClip(text, dialect)
    await putAudio(key, clip).catch(() => {}) // a full phone still plays it, just doesn't keep it
    return clip
  } catch {
    return null
  }
}

function speakOnDevice(text: string): boolean {
  if (typeof speechSynthesis === "undefined") return false
  const voice = speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith("es"))
  if (!voice) return false
  const u = new SpeechSynthesisUtterance(text)
  u.voice = voice
  u.lang = voice.lang
  u.rate = 0.9
  speechSynthesis.cancel()
  speechSynthesis.speak(u)
  return true
}

async function play(key: string, text: string, dialect: SpanishDialect): Promise<PlayResult> {
  const clip = await clipFor(key, text, dialect)
  if (!clip) return speakOnDevice(text) ? { kind: "device" } : { kind: "none" }
  const url = URL.createObjectURL(clip)
  const audio = new Audio(url)
  await audio.play()
  return { kind: "audio", audio, url }
}

export function playWord(word: string, dialect: SpanishDialect): Promise<PlayResult> {
  return play(wordAudioKey(dialect, word), word, dialect)
}

export function playPage(pageId: string, spanish: string, dialect: SpanishDialect): Promise<PlayResult> {
  return play(pageAudioKey(pageId, dialect, spanish), spanish, dialect)
}

export function stopPlayback(result: PlayResult | null) {
  if (!result) return
  if (result.kind === "audio") {
    result.audio.pause()
    URL.revokeObjectURL(result.url)
  } else if (result.kind === "device" && typeof speechSynthesis !== "undefined") {
    speechSynthesis.cancel()
  }
}
