// The canonical site origin, in one place. Set NEXT_PUBLIC_SITE_URL in the
// deployment environment (e.g. https://hablaba.app); the fallback only exists
// so local builds produce absolute URLs.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://spanishroutine.com"
