/**
 * The phone has no room left (localStorage or IndexedDB quota). Unlike the
 * other stores, Cuentos surfaces this instead of swallowing it: a photo that
 * silently failed to save would be a page that's just gone next time.
 */
export class StorageFullError extends Error {
  constructor() {
    super("storage full")
    this.name = "StorageFullError"
  }
}

export function isQuotaError(err: unknown): boolean {
  if (!(err instanceof Error) && !(typeof DOMException !== "undefined" && err instanceof DOMException)) return false
  const name = (err as { name?: string }).name
  return name === "QuotaExceededError" || name === "NS_ERROR_DOM_QUOTA_REACHED"
}

/** The plain message, in the chrome's register (tú). */
export const STORAGE_FULL_MESSAGE = "No queda espacio en el teléfono. Borra un cuento para sumar otro."
