"use client"

// Cuentos is ONE static route, /app/speak/cuentos, with the view in the query
// string (docs/cuentos-plan.md §2). Moving between views uses the native
// history API, which Next's router syncs into useSearchParams without asking
// the server for anything, so the whole shelf works offline once the page
// has been opened.

export const CUENTOS_PATH = "/app/speak/cuentos"

export type CuentosView =
  | { view: "shelf" }
  | { view: "new" }
  | { view: "book"; bookId: string }
  | { view: "read"; bookId: string; page: number }
  | { view: "add"; bookId: string }
  | { view: "edit"; bookId: string; pageId: string }

export function viewFromParams(params: URLSearchParams): CuentosView {
  const bookId = params.get("libro")
  if (params.get("nuevo")) return { view: "new" }
  if (!bookId) return { view: "shelf" }
  if (params.get("sumar")) return { view: "add", bookId }
  const pageId = params.get("editar")
  if (pageId) return { view: "edit", bookId, pageId }
  const leer = params.get("leer")
  if (leer !== null) return { view: "read", bookId, page: Math.max(0, Number(leer) || 0) }
  return { view: "book", bookId }
}

export function urlFor(v: CuentosView): string {
  switch (v.view) {
    case "shelf":
      return CUENTOS_PATH
    case "new":
      return `${CUENTOS_PATH}?nuevo=1`
    case "book":
      return `${CUENTOS_PATH}?libro=${v.bookId}`
    case "read":
      return `${CUENTOS_PATH}?libro=${v.bookId}&leer=${v.page}`
    case "add":
      return `${CUENTOS_PATH}?libro=${v.bookId}&sumar=1`
    case "edit":
      return `${CUENTOS_PATH}?libro=${v.bookId}&editar=${v.pageId}`
  }
}

export function go(v: CuentosView, opts: { replace?: boolean } = {}) {
  const url = urlFor(v)
  if (opts.replace) window.history.replaceState(null, "", url)
  else window.history.pushState(null, "", url)
  window.scrollTo(0, 0)
}
