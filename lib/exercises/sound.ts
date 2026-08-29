// Success sounds for Exercises — synthesized on-device with WebAudio, no
// asset files. The palette is the audio version of Clay + calm: a soft,
// marimba-ish two-note ping when an answer lands, a three-note resolve when a
// session finishes. Deliberately NO failure sound — a miss already gets the
// calm terracotta card; a buzzer is Duolingo territory.

let ctx: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null
  try {
    if (!ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return null
      ctx = new Ctor()
    }
    // iOS suspends contexts created outside a gesture; these play from taps,
    // so a resume here is allowed to succeed.
    if (ctx.state === "suspended") void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

/** One soft struck note: triangle through a lowpass, fast attack, long-ish decay. */
function note(ac: AudioContext, freq: number, at: number, peak: number, decay: number) {
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  const filter = ac.createBiquadFilter()

  osc.type = "triangle"
  osc.frequency.value = freq
  filter.type = "lowpass"
  filter.frequency.value = 2400
  filter.Q.value = 0.5

  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.exponentialRampToValueAtTime(peak, at + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + decay)

  osc.connect(filter)
  filter.connect(gain)
  gain.connect(ac.destination)
  osc.start(at)
  osc.stop(at + decay + 0.05)
}

/** The "¡eso es!" ping: two quiet ascending notes (C5 → G5). */
export function playCorrect() {
  const ac = getContext()
  if (!ac) return
  try {
    const t = ac.currentTime + 0.01
    note(ac, 523.25, t, 0.11, 0.32)
    note(ac, 783.99, t + 0.09, 0.13, 0.42)
  } catch {}
}

/** End-of-session resolve: a gentle C-major arpeggio, slightly longer tail. */
export function playFinish() {
  const ac = getContext()
  if (!ac) return
  try {
    const t = ac.currentTime + 0.01
    note(ac, 523.25, t, 0.1, 0.4)
    note(ac, 659.25, t + 0.11, 0.1, 0.45)
    note(ac, 783.99, t + 0.22, 0.12, 0.7)
  } catch {}
}
