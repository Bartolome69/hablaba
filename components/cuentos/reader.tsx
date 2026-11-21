"use client"

// The reading view: very large, steady Spanish for the parent to read aloud.
// - Tap a word to hear it (Elena's voice, cached on the phone).
// - "Leer" plays the whole page, only when tapped; nothing plays unasked, and
//   there is no auto-advance.
// - English is hidden by default; text size and "Luz baja" are right here.
// - The screen stays on while it's open (a dimming screen mid-page is exactly
//   the bedtime annoyance to avoid).
// It covers the tab bar (fixed, above the nav), so nothing competes with the page.

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { DuoIcon } from "@/components/icons"
import { CuentosApiError, ERROR_COPY, translatePage } from "@/lib/cuentos/api"
import { playPage, playWord, stopPlayback, type PlayResult } from "@/lib/cuentos/audio"
import { go } from "@/lib/cuentos/nav"
import {
  getBook,
  getPrefs,
  getTranslation,
  listPages,
  saveModelTranslation,
  savePrefs,
  touchBook,
  translationStatus,
} from "@/lib/cuentos/store"
import { splitWords } from "@/lib/cuentos/text"
import type { Book, BookPage, CuentosPrefs } from "@/lib/cuentos/types"
import { useImmersive } from "@/lib/ui/immersive"
import { useWakeLock } from "@/lib/voice/use-wake-lock"
import { toast } from "sonner"
import { Missing } from "./add-page"
import { Spinner, usePhotoUrl } from "./shared"

const SIZES: CuentosPrefs["size"][] = ["m", "l", "xl", "xxl"]
const SIZE_PX: Record<CuentosPrefs["size"], number> = { m: 26, l: 30, xl: 35, xxl: 41 }

type Spanish =
  | { state: "loading" }
  | { state: "ready"; text: string; notes?: string; stale: boolean; edited: boolean }
  | { state: "missing"; reason: "offline" | "error"; kind?: string }

export function Reader({ bookId, page: requested }: { bookId: string; page: number }) {
  useImmersive(true)
  useWakeLock(true)

  const [book, setBook] = useState<Book | null | undefined>(undefined)
  const [pages, setPages] = useState<BookPage[]>([])
  const [idx, setIdx] = useState(requested)
  const [prefs, setPrefsState] = useState<CuentosPrefs>({ size: "l", dim: false, showEnglish: false })
  const [spanish, setSpanish] = useState<Spanish>({ state: "loading" })
  const [tapped, setTapped] = useState<string | null>(null)
  const [playingPage, setPlayingPage] = useState(false)
  const [peek, setPeek] = useState(false)
  const [confirmReplace, setConfirmReplace] = useState(false)
  const playing = useRef<PlayResult | null>(null)

  useEffect(() => {
    const b = getBook(bookId)
    setBook(b)
    const ps = b ? listPages(bookId) : []
    setPages(ps)
    setIdx((i) => Math.min(Math.max(0, i), Math.max(0, ps.length - 1)))
    setPrefsState(getPrefs())
  }, [bookId])

  const page = pages[idx]
  const photoUrl = usePhotoUrl(peek ? page?.photoId : undefined)

  const stop = useCallback(() => {
    stopPlayback(playing.current)
    playing.current = null
    setPlayingPage(false)
    setTapped(null)
  }, [])
  useEffect(() => stop, [stop])

  // The page's Spanish in this book's dialect: saved, stale, or translated now.
  const translate = useCallback(
    async (p: BookPage, b: Book, overwriteEdited = false) => {
      setSpanish({ state: "loading" })
      try {
        const result = await translatePage(p.sourceText, b.dialect)
        saveModelTranslation(p, b.dialect, result, { overwriteEdited })
        const t = getTranslation(p.id, b.dialect)!
        setSpanish({ state: "ready", text: t.text, notes: t.notes, stale: translationStatus(p, b.dialect) === "stale", edited: t.edited })
      } catch (err) {
        const kind = err instanceof CuentosApiError ? err.kind : "failed"
        const saved = getTranslation(p.id, b.dialect)
        if (saved) {
          setSpanish({ state: "ready", text: saved.text, notes: saved.notes, stale: true, edited: saved.edited })
          toast.error(ERROR_COPY[kind])
        } else setSpanish({ state: "missing", reason: kind === "offline" ? "offline" : "error", kind })
      }
    },
    [],
  )

  useEffect(() => {
    if (!book || !page) return
    stop()
    setConfirmReplace(false)
    touchBook(bookId, idx)
    window.history.replaceState(null, "", `/app/speak/cuentos?libro=${bookId}&leer=${idx}`)
    const saved = getTranslation(page.id, book.dialect)
    if (saved) {
      setSpanish({
        state: "ready",
        text: saved.text,
        notes: saved.notes,
        stale: translationStatus(page, book.dialect) === "stale",
        edited: saved.edited,
      })
    } else {
      void translate(page, book)
    }
  }, [book, page, idx, bookId, stop, translate])

  const setPrefs = (patch: Partial<CuentosPrefs>) => {
    setPrefsState((p) => ({ ...p, ...patch }))
    savePrefs(patch)
  }

  const say = async (key: string, word: string) => {
    if (!book) return
    stop()
    setTapped(key)
    try {
      const result = await playWord(word, book.dialect)
      playing.current = result
      if (result.kind === "audio") result.audio.onended = () => setTapped((k) => (k === key ? null : k))
      else if (result.kind === "none") toast("Sin conexión para el audio de esta palabra")
      else setTimeout(() => setTapped((k) => (k === key ? null : k)), 1200)
    } catch {
      setTapped(null)
    }
  }

  const readPage = async () => {
    if (!book || !page || spanish.state !== "ready") return
    if (playingPage) {
      stop()
      return
    }
    stop()
    setPlayingPage(true)
    try {
      const result = await playPage(page.id, spanish.text, book.dialect)
      playing.current = result
      if (result.kind === "audio") result.audio.onended = () => setPlayingPage(false)
      else if (result.kind === "none") {
        setPlayingPage(false)
        toast("Sin conexión para leer la página en voz alta")
      }
    } catch {
      setPlayingPage(false)
    }
  }

  const lines = useMemo(() => (spanish.state === "ready" ? spanish.text.split("\n") : []), [spanish])

  if (book === undefined) return <div className="fixed inset-0 z-50 bg-background" />
  if (!book) return <Missing />
  if (!page) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background px-8 text-center">
        <p className="font-serif text-[20px] text-ink">Este cuento todavía no tiene páginas.</p>
        <button onClick={() => go({ view: "add", bookId })} className="clay-green h-12 rounded-full px-6 font-semibold text-cream">
          Sumar una página
        </button>
      </div>
    )
  }

  const dim = prefs.dim
  const last = idx === pages.length - 1
  const fg = dim ? "text-cream" : "text-ink"
  const muted = dim ? "text-green-on-dark" : "text-ink-muted"
  const chip = dim ? "text-cream" : "text-ink"

  return (
    <div
      className={`fixed inset-0 z-50 mx-auto flex max-w-lg flex-col ${dim ? "bg-green-press" : "bg-background"}`}
      style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
    >
      <header className="flex items-center gap-2 px-3">
        <button onClick={() => go({ view: "shelf" })} aria-label="Cerrar el cuento" className={`flex h-11 w-11 items-center justify-center rounded-full ${chip}`}>
          <DuoIcon name="volver" size={18} className="rotate-[-90deg]" detail={dim ? "#A8D0B4" : undefined} />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <p className={`truncate text-[14px] font-semibold ${fg}`}>{book.title}</p>
          <p className={`text-[12px] tabular-nums ${muted}`}>
            {idx + 1} / {pages.length}
          </p>
        </div>
        <button
          onClick={() => go({ view: "book", bookId })}
          aria-label="Las páginas del cuento"
          className={`flex h-11 w-11 items-center justify-center rounded-full ${chip}`}
        >
          <DuoIcon name="overflow" size={20} detail={dim ? "#A8D0B4" : undefined} />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-7 pb-6 pt-4">
        {spanish.state === "ready" && spanish.stale && (
          <div className={`mb-4 flex items-center justify-between gap-3 rounded-[14px] px-3.5 py-1.5 ${dim ? "bg-green-well" : "bg-sunken"}`}>
            <p className={`text-[13px] ${fg}`}>El inglés cambió.</p>
            <button
              onClick={() => (spanish.edited ? setConfirmReplace(true) : void translate(page, book))}
              className={`min-h-11 text-[13px] font-semibold ${dim ? "text-cream" : "text-green"}`}
            >
              Traducir de nuevo
            </button>
          </div>
        )}
        {confirmReplace && (
          <div className={`mb-4 rounded-[14px] p-3.5 ${dim ? "bg-green-well" : "bg-sunken"}`}>
            <p className={`text-[13.5px] leading-snug ${fg}`}>Cambiaste el español a mano. ¿Traducir de nuevo y reemplazarlo?</p>
            <div className="mt-2 flex gap-2">
              <button onClick={() => (setConfirmReplace(false), void translate(page, book, true))} className={`min-h-11 rounded-full px-4 text-[13.5px] font-semibold ${fg}`}>
                Reemplazar
              </button>
              <button onClick={() => setConfirmReplace(false)} className={`min-h-11 rounded-full px-4 text-[13.5px] font-medium ${muted}`}>
                Dejar el mío
              </button>
            </div>
          </div>
        )}

        {spanish.state === "loading" && (
          <div className={`flex items-center gap-3 pt-10 ${fg}`} role="status">
            <Spinner light={dim} /> Traduciendo…
          </div>
        )}

        {spanish.state === "missing" && (
          <div className="pt-8">
            <p className={`font-serif text-[20px] leading-snug ${fg}`}>
              {spanish.reason === "offline"
                ? "Esta página todavía no está en español. Conéctate para traducirla."
                : "No pudimos traducir esta página."}
            </p>
            {spanish.reason !== "offline" && (
              <button onClick={() => void translate(page, book)} className={`mt-3 min-h-11 font-semibold ${dim ? "text-cream" : "text-green"}`}>
                Intentar de nuevo
              </button>
            )}
          </div>
        )}

        {spanish.state === "ready" && (
          <div
            lang="es"
            className={`font-serif ${fg}`}
            style={{ fontSize: SIZE_PX[prefs.size], lineHeight: 1.5, letterSpacing: "-0.005em" }}
          >
            {lines.map((line, li) =>
              line.trim() === "" ? (
                <div key={li} style={{ height: "0.75em" }} aria-hidden />
              ) : (
                <p key={li}>
                  {splitWords(line).map((tok, ti) => {
                    if (!tok.word) return <span key={ti}>{tok.text}</span>
                    const key = `${li}:${ti}`
                    const on = tapped === key
                    return (
                      <span
                        key={ti}
                        role="button"
                        tabIndex={0}
                        onClick={() => void say(key, tok.text)}
                        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && void say(key, tok.text)}
                        className="cursor-pointer rounded-[4px] decoration-terracotta decoration-[3px] underline-offset-[6px]"
                        style={on ? { textDecorationLine: "underline" } : undefined}
                      >
                        {tok.text}
                      </span>
                    )
                  })}
                </p>
              ),
            )}
            {spanish.notes && prefs.showEnglish && <p className={`mt-4 font-sans text-[13px] ${muted}`}>{spanish.notes}</p>}
          </div>
        )}

        {prefs.showEnglish && (
          <div lang="en" className={`mt-6 border-t pt-4 text-[16px] leading-relaxed ${dim ? "border-green-well" : "border-rule"} ${muted}`}>
            {page.sourceText.split("\n").map((l, i) => (
              <p key={i} style={l.trim() ? undefined : { height: "0.6em" }}>
                {l}
              </p>
            ))}
          </div>
        )}
      </main>

      <footer
        className={`border-t px-4 pt-3 ${dim ? "border-green-well" : "border-rule"}`}
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            disabled={idx === 0}
            className={`flex h-14 min-w-[92px] items-center justify-center gap-1 rounded-full text-[14px] font-medium disabled:opacity-30 ${chip}`}
          >
            <DuoIcon name="chevron" size={13} className="rotate-180" /> Anterior
          </button>
          <button
            onClick={() => void readPage()}
            disabled={spanish.state !== "ready"}
            className={`flex h-14 flex-1 items-center justify-center gap-2 rounded-full text-[16px] font-semibold text-cream disabled:opacity-50 ${dim ? "bg-green-well" : "clay-green"}`}
          >
            <DuoIcon name={playingPage ? "pausa" : "play"} size={20} className="text-cream" detail="#A8D0B4" />
            {playingPage ? "Pausa" : "Leer"}
          </button>
          <button
            onClick={() => (last ? go({ view: "book", bookId }) : setIdx((i) => i + 1))}
            className={`flex h-14 min-w-[92px] items-center justify-center gap-1 rounded-full text-[14px] font-medium ${chip}`}
          >
            {last ? "Fin" : "Siguiente"} {!last && <DuoIcon name="chevron" size={13} />}
          </button>
        </div>
        <div className="mt-1 grid grid-cols-4">
          <Tool
            dim={dim}
            label="Tamaño"
            onClick={() => setPrefs({ size: SIZES[(SIZES.indexOf(prefs.size) + 1) % SIZES.length] })}
          >
            <span className="font-serif text-[17px] leading-none">Aa</span>
          </Tool>
          <Tool dim={dim} label="Luz baja" pressed={dim} onClick={() => setPrefs({ dim: !dim })}>
            <DuoIcon name="luna" size={18} detail={dim ? "#A8D0B4" : undefined} />
          </Tool>
          <Tool dim={dim} label="Inglés" pressed={prefs.showEnglish} onClick={() => setPrefs({ showEnglish: !prefs.showEnglish })}>
            <span className="text-[13px] font-bold leading-none">EN</span>
          </Tool>
          <Tool dim={dim} label="Foto" onClick={() => setPeek(true)}>
            <DuoIcon name="cuento" size={18} detail={dim ? "#A8D0B4" : undefined} />
          </Tool>
        </div>
      </footer>

      {peek && (
        <button
          onClick={() => setPeek(false)}
          aria-label="Cerrar la foto"
          className="fixed inset-0 z-[60] mx-auto flex max-w-lg items-center justify-center bg-black/85 p-4"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {photoUrl ? <img src={photoUrl} alt="La foto de la página" className="max-h-full max-w-full rounded-[12px]" /> : <Spinner light />}
        </button>
      )}
    </div>
  )
}

function Tool({
  label,
  pressed,
  dim,
  onClick,
  children,
}: {
  label: string
  pressed?: boolean
  dim: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={pressed}
      className={`flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-[14px] ${
        dim ? "text-cream" : "text-ink"
      } ${pressed ? (dim ? "bg-green-well" : "bg-sunken") : ""}`}
    >
      {children}
      {/* Green-on-dark is 3.8:1 on the pressed well, so a pressed label goes cream. */}
      <span className={`text-[12px] ${dim ? (pressed ? "text-cream" : "text-green-on-dark") : "text-ink-muted"}`}>{label}</span>
    </button>
  )
}
