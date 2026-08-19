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
 * Default for the keep-screen-awake toggle.
 *
 * On iOS the screen locking IS the session ending, so holding the screen on is
 * the only way to have a long conversation. On Android audio survives the
 * screen going off, and a screen held on for 15 minutes in a pocket is battery
 * burn plus stray taps — so default it off and let the parent opt in.
 */
export function defaultKeepScreenAwake(): boolean {
  return !isAndroid()
}

/** Where the parent actually has to go to undo a denied mic permission. */
export function micPermissionHelp(): string {
  if (isAndroid()) {
    return "En Android: mantené apretado el ícono de Hablaba → Información de la app → Permisos → Micrófono."
  }
  if (isIOS()) {
    return "En iPhone: Ajustes → Safari → Micrófono, y permitilo para este sitio."
  }
  return "Buscá el ícono de candado en la barra de direcciones y permití el micrófono."
}
