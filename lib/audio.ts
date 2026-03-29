/**
 * Creates an Audio element from a blob URL and waits for it to be ready
 * before playing. Resolves once playback starts, rejects on error.
 */
export function playAudio(url: string): Promise<HTMLAudioElement> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(url)
    audio.addEventListener(
      "canplaythrough",
      () => {
        audio.play().then(() => resolve(audio)).catch(reject)
      },
      { once: true }
    )
    audio.addEventListener("error", () => reject(new Error("Audio error")), { once: true })
    audio.load()
  })
}
