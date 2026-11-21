"use client"

// Cuentos picks its view from the query string (lib/cuentos/nav.ts): one
// static route, so a book reopens offline once the page has been visited.

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { viewFromParams } from "@/lib/cuentos/nav"
import { getBook, getPage } from "@/lib/cuentos/store"
import type { Book, BookPage } from "@/lib/cuentos/types"
import { AddPage, Missing } from "./add-page"
import { BookDetails } from "./book-details"
import { NewBook } from "./new-book"
import { PageEditor } from "./page-editor"
import { Reader } from "./reader"
import { ScreenHeader } from "./shared"
import { Shelf } from "./shelf"
import { go } from "@/lib/cuentos/nav"

function EditPage({ bookId, pageId }: { bookId: string; pageId: string }) {
  const [data, setData] = useState<{ book: Book | null; page: BookPage | null } | null>(null)
  useEffect(() => setData({ book: getBook(bookId), page: getPage(pageId) }), [bookId, pageId])
  if (!data) return <div className="min-h-dvh bg-background" />
  if (!data.book || !data.page) return <Missing />
  return (
    <div className="min-h-dvh bg-background px-[22px] pb-36 pt-6">
      <ScreenHeader
        title={data.book.title}
        subtitle={`Página ${data.page.index + 1}`}
        onBack={() => go({ view: "book", bookId })}
        backLabel="Volver al cuento"
      />
      <PageEditor
        book={data.book}
        input={{ mode: "edit", page: data.page }}
        onSaved={(page) => go({ view: "read", bookId, page: page.index }, { replace: true })}
      />
    </div>
  )
}

export function CuentosApp() {
  const params = useSearchParams()
  // localStorage and IndexedDB are client-only: render after mount.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="min-h-dvh bg-background" />

  const v = viewFromParams(new URLSearchParams(params.toString()))
  switch (v.view) {
    case "shelf":
      return <Shelf />
    case "new":
      return <NewBook />
    case "book":
      return <BookDetails key={v.bookId} bookId={v.bookId} />
    case "read":
      return <Reader key={v.bookId} bookId={v.bookId} page={v.page} />
    case "add":
      return <AddPage key={v.bookId} bookId={v.bookId} />
    case "edit":
      return <EditPage key={v.pageId} bookId={v.bookId} pageId={v.pageId} />
  }
}
