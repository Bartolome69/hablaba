// Platform quirks that voice mode has to bend around.
//
// Primary target is Chrome on Android, installed as a PWA. iOS Safari is kept
// working but is the fallback path, not the shape the design is drawn around.

/** iPadOS reports itself as a Mac, so touch points are the tell. */
export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false
  const ua = navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1)
}

export function isAndroid(): boolean {
  if (typeof navigator === "undefined") return false
  return /Android/.test(navigator.userAgent)
}

/**
 * Does backgrounding the app kill audio capture?
 *
 * iOS suspends the mic when Safari backgrounds or the screen locks, and does
 * not resume it — a session that looks live is actually deaf, so we end it and
 * say so. Android Chrome keeps an active WebRTC session running with the screen
 * off, which is the whole point for a parent walking with a pram, so we leave
 * it alone and let genuine drops surface through the connection state instead.
 *
 * Aggressive OEM battery management (Samsung, Xiaomi, OnePlus) can still kill a
 * backgrounded session on Android. That path lands as a connection failure
 * rather than a clean pause, which is the honest thing to show anyway.
 */
export function suspendsAudioOnBackground(): boolean {
  return isIOS()
}

/**
 * Can this browser hold the screen on? (Screen Wake Lock API: Chrome on
 * Android, and Safari from iOS 16.4, including installed PWAs from 18.4.)
 *
 * The lock is held during every live or paused voice session (refresh Phase
 * 6). On iOS it is what keeps the conversation alive at all, since a locked
 * screen suspends the mic. On Android audio survives the screen going off,
 * but the lock still keeps the pocket view up so the controls are there when
 * you take the phone out. Where it is unsupported the thread says so plainly.
 */
export function wakeLockSupported(): boolean {
  return typeof navigator !== "undefined" && "wakeLock" in navigator
}

/** Where the parent actually has to go to undo a denied mic permission. */
export function micPermissionHelp(): string {
  if (isAndroid()) {
    return "En Android: mantén pulsado el ícono de Hablaba → Información de la app → Permisos → Micrófono."
  }
  if (isIOS()) {
    return "En iPhone: Ajustes → Safari → Micrófono, y permítelo para este sitio."
  }
  return "Busca el ícono de candado en la barra de direcciones y permite el micrófono."
}
