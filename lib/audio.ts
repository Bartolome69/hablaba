/**
 * Creates an Audio element from a URL and starts playback as soon as the
 * browser has enough data to begin — does not wait for the full file.
 */
export function playAudio(url: string): Promise<HTMLAudioElement> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(url)
    audio.preload = "auto"
    let started = false
    const start = () => {
      if (started) return
      started = true
      audio.play().then(() => resolve(audio)).catch(reject)
    }
    audio.addEventListener("canplay", start, { once: true })
    audio.addEventListener("error", () => reject(new Error("Audio error")), { once: true })
    audio.load()
  })
}

export function ttsUrl(text: string, voice: string): string {
  const params = new URLSearchParams({ text, voice })
  return `/api/tts?${params.toString()}`
}
