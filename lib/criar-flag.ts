// The Grow module is gated by the `criar_enabled` localStorage flag (internal
// codename, unaffected by the Grow rename): unlocked by long-pressing the
// section title in AppHeader, or by visiting /grow directly (the seed sets it).

export const CRIAR_FLAG = "criar_enabled"

export function isCriarEnabled(): boolean {
  try {
    return localStorage.getItem(CRIAR_FLAG) === "1"
  } catch {
    return false
  }
}
