// The Grow module is gated by the `criar_enabled` localStorage flag (internal
// codename, unaffected by the Grow rename): toggled from the main app Settings
// (see components/settings-sheet.tsx), or unlocked by visiting /grow directly
// (the seed sets it).

export const CRIAR_FLAG = "criar_enabled"

// Fired on the window whenever the flag changes, so components that gate on it
// (e.g. BottomNav) can update live without a reload.
export const CRIAR_FLAG_EVENT = "criar-flag-change"

export function isCriarEnabled(): boolean {
  try {
    return localStorage.getItem(CRIAR_FLAG) === "1"
  } catch {
    return false
  }
}

export function setCriarEnabled(enabled: boolean): void {
  try {
    if (enabled) localStorage.setItem(CRIAR_FLAG, "1")
    else localStorage.removeItem(CRIAR_FLAG)
    window.dispatchEvent(new CustomEvent(CRIAR_FLAG_EVENT))
  } catch {}
}
