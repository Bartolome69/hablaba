"use client"

// Client side of the Cuentos routes. Errors come back as a small closed set the
// screens turn into Spanish copy, so no state is a dead end.

import type { SpanishDialect } from "./types"

export type CuentosErrorKind =
  | "offline" // no network
  | "no_key" // the server has no AI key: read on the phone instead
  | "no_text" // the photo has no readable text
  | "too_large"
  | "failed" // anything else; retry

export class CuentosApiError extends Error {
  constructor(public kind: CuentosErrorKind) {
    super(kind)
    this.name = "CuentosApiError"
  }
}

function kindFor(status: number, error?: string): CuentosErrorKind {
  if (status === 503 && error === "no_key") return "no_key"
  if (status === 422) return "no_text"
  if (status === 413) return "too_large"
  return "failed"
}

async function call<T>(url: string, init: RequestInit): Promise<T> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) throw new CuentosApiError("offline")
  let res: Response
  try {
    res = await fetch(url, init)
  } catch {
    throw new CuentosApiError(navigator.onLine === false ? "offline" : "failed")
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new CuentosApiError(kindFor(res.status, body.error))
  }
  return (await res.json()) as T
}

export async function readPageText(photo: Blob): Promise<{ text: string }> {
  const form = new FormData()
  form.append("image", photo, "page.jpg")
  return call<{ text: string }>("/api/cuentos/ocr", { method: "POST", body: form })
}

export async function translatePage(text: string, dialect: SpanishDialect): Promise<{ spanish: string; notes?: string }> {
  return call("/api/cuentos/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, dialect }),
  })
}

/** Spanish copy for each error, in the chrome's register. */
export const ERROR_COPY: Record<CuentosErrorKind, string> = {
  offline: "Sin conexión. Puedes escribir el texto o probar más tarde.",
  no_key: "No podemos leer la foto en línea ahora.",
  no_text: "No encontramos texto en la foto.",
  too_large: "La foto es demasiado grande. Prueba con otra.",
  failed: "Algo falló. Prueba de nuevo.",
}
