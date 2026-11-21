"use client"

// The way into Cuentos from Frases: one quiet card, with the book you were
// reading when there is one.

import Link from "next/link"
import { useEffect, useState } from "react"
import { DuoIcon } from "@/components/icons"
import { CUENTOS_PATH, urlFor } from "@/lib/cuentos/nav"
import { countPages, listBooks } from "@/lib/cuentos/store"
import type { Book } from "@/lib/cuentos/types"

export function CuentosRow() {
  const [state, setState] = useState<{ count: number; last: Book | null; pages: number } | null>(null)
  useEffect(() => {
    const books = listBooks()
    const last = books[0] ?? null
    setState({ count: books.length, last, pages: last ? countPages(last.id) : 0 })
  }, [])

  const resume = state?.last && state.pages > 0 ? state.last : null

  return (
    <section className="mt-9" data-cuentos-row>
      <h2 className="px-1 font-serif text-[19px] text-ink">Cuentos</h2>
      <Link href={CUENTOS_PATH} className="clay-card mt-2.5 flex items-center gap-[13px] rounded-[22px] p-4">
        <div className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-[14px] bg-green-tint text-ink">
          <DuoIcon name="cuento" size={24} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[15.5px] font-semibold text-ink">Lee sus libros en español</p>
          <p className="truncate text-[12.5px] leading-snug text-ink-muted">
            {state && state.count > 0
              ? `${state.count} ${state.count === 1 ? "cuento" : "cuentos"} en este teléfono`
              : "Saca una foto de una página y la lees en español"}
          </p>
        </div>
        <DuoIcon name="chevron" size={15} className="flex-none text-ink-muted" />
      </Link>
      {resume && (
        <Link
          href={urlFor({ view: "read", bookId: resume.id, page: resume.lastPageIndex })}
          className="mt-1 flex min-h-11 items-center px-1 text-[13px] font-medium text-terracotta-ink"
        >
          Seguir leyendo {resume.title}
        </Link>
      )}
    </section>
  )
}
