/**
 * Creates an Audio element from a URL and starts playback as soon as the
 * browser has enough data to begin — does not wait for the full file.
 *
 * Pass an AbortSignal to cancel playback. If the signal aborts before the
 * audio is ready (e.g. the user navigates away before the clip starts),
 * `.play()` is never called, so nothing plays in the background; if it
 * aborts after playback has begun, the audio is paused. An aborted call
 * rejects with an AbortError, which callers should treat as a silent no-op.
 */
export function playAudio(url: string, signal?: AbortSignal): Promise<HTMLAudioElement> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"))
      return
    }

    const audio = new Audio(url)
    audio.preload = "auto"

    const cleanup = () => {
      audio.removeEventListener("canplay", onCanPlay)
      audio.removeEventListener("error", onError)
      signal?.removeEventListener("abort", onAbort)
    }

    const onCanPlay = () => {
      cleanup()
      // Aborted while we were waiting for the clip to be ready — never start.
      if (signal?.aborted) {
        reject(new DOMException("Aborted", "AbortError"))
        return
      }
      audio.play().then(() => resolve(audio)).catch(reject)
    }

    const onError = () => {
      cleanup()
      reject(new Error("Audio error"))
    }

    const onAbort = () => {
      cleanup()
      audio.pause()
      audio.removeAttribute("src") // stop buffering
      reject(new DOMException("Aborted", "AbortError"))
    }

    signal?.addEventListener("abort", onAbort, { once: true })
    audio.addEventListener("canplay", onCanPlay, { once: true })
    audio.addEventListener("error", onError, { once: true })
    audio.load()
  })
}

// No voice parameter: she has one voice and the server owns it, so the client
// can't ask for a different one. `dialect` is her accent (from the profile) and
// `manner` is what this line is for — both are part of the cache key, which is
// what we want: the same sentence read conversationally and read clearly are
// different audio and should be cached separately.
export function ttsUrl(
  text: string,
  opts?: { dialect?: "rioplatense" | "neutral"; manner?: "conversational" | "clear" },
): string {
  const params = new URLSearchParams({ text })
  if (opts?.dialect) params.set("dialect", opts.dialect)
  if (opts?.manner) params.set("manner", opts.manner)
  return `/api/tts?${params.toString()}`
}
