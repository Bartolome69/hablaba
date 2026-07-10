"use client"

import { useEffect, useState } from "react"
import { Check, Music, Zap } from "lucide-react"
import { AppTabs } from "@/components/app-tabs"
import type { CriarCapture, CriarCaptureStatus, CriarChild, CriarPack } from "@/lib/criar/types"
import { stageMoments } from "@/lib/criar/stage"
import { ensureSeeded } from "@/lib/criar/seed"
import { listCaptures, listPacks, todayKey } from "@/lib/criar/store"

const statusLabels: Record<CriarCaptureStatus, string> = {
  new: "queued",
  taught: "taught",
  learning: "learning",
  learned: "learned",
}

const statusStyles: Record<CriarCaptureStatus, string> = {
  new: "bg-secondary text-muted-foreground",
  taught: "bg-primary/10 text-primary",
  learning: "bg-primary/10 text-primary",
  learned: "bg-primary text-primary-foreground",
}

interface JournalDay {
  date: string // YYYY-MM-DD
  pack?: CriarPack
  captures: CriarCapture[]
}

function buildDays(packs: CriarPack[], captures: CriarCapture[]): JournalDay[] {
  const byDate = new Map<string, JournalDay>()
  const day = (date: string): JournalDay => {
    let d = byDate.get(date)
    if (!d) {
      d = { date, captures: [] }
      byDate.set(date, d)
    }
    return d
  }
  packs.forEach((p) => {
    day(p.date).pack = p
  })
  captures.forEach((c) => {
    day(c.createdAt.slice(0, 10)).captures.push(c)
  })
  return [...byDate.values()].sort((a, b) => b.date.localeCompare(a.date))
}

function formatDay(date: string): string {
  const today = todayKey()
  if (date === today) return "Today"
  const yesterday = new Date(`${today}T00:00:00`)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date === todayKey(yesterday)) return "Yesterday"
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
  })
}

export default function JournalPage() {
  const [child, setChild] = useState<CriarChild | null>(null)
  const [days, setDays] = useState<JournalDay[]>([])

  useEffect(() => {
    const seeded = ensureSeeded()
    setChild(seeded)
    setDays(buildDays(listPacks(seeded.id), listCaptures(seeded.id)))
  }, [])

  if (!child) {
    return <div className="min-h-dvh bg-background" />
  }

  return (
    <div className="min-h-dvh bg-background px-4 py-6 pb-24">
      <header className="mb-6">
        <div className="mb-3">
          <h1 className="font-serif text-2xl text-foreground">Journal</h1>
          <p className="text-sm text-muted-foreground">
            {child.name}&apos;s family phrasebook — every pack and capture, day by day.
          </p>
        </div>
        <AppTabs />
      </header>

      {days.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nothing here yet — generate your first pack and it&apos;ll start filling up.
        </p>
      )}

      <div className="space-y-6">
        {days.map((day) => (
          <section key={day.date}>
            <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {formatDay(day.date)}
            </h2>

            <div className="space-y-3">
              {day.captures.map((capture) => (
                <div
                  key={capture.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
                >
                  <Zap className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <p className="min-w-0 flex-1 truncate text-sm text-foreground">
                    &ldquo;{capture.text}&rdquo;
                  </p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[capture.status]}`}
                  >
                    {statusLabels[capture.status]}
                  </span>
                </div>
              ))}

              {day.pack && <PackEntry pack={day.pack} />}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

function PackEntry({ pack }: { pack: CriarPack }) {
  const moment = stageMoments[pack.stage].find((m) => m.id === pack.moment)
  const learnedCount = pack.phrases.filter((p) => p.learned).length

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">
          {moment ? `${moment.emoji} ${moment.label}` : "Pack"}
        </h3>
        <span className="text-xs text-muted-foreground">
          {learnedCount}/{pack.phrases.length} learned
        </span>
      </div>

      <ul className="space-y-1.5">
        {pack.phrases.map((phrase) => (
          <li key={phrase.id} className="flex items-start gap-2">
            <span
              className={`mt-1 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full ${
                phrase.learned ? "bg-primary text-primary-foreground" : "bg-secondary"
              }`}
            >
              {phrase.learned && <Check className="h-2.5 w-2.5" />}
            </span>
            <span className="min-w-0 text-sm">
              <span className="text-foreground">{phrase.spanish}</span>{" "}
              <span className="text-muted-foreground">— {phrase.english}</span>
            </span>
          </li>
        ))}
      </ul>

      {pack.captureLessons.length > 0 && (
        <p className="mt-3 border-t border-border pt-2 text-xs text-muted-foreground">
          {pack.captureLessons.length === 1
            ? "1 capture mini-lesson"
            : `${pack.captureLessons.length} capture mini-lessons`}
          : {pack.captureLessons.map((l) => l.spanish).join(" · ")}
        </p>
      )}

      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Music className="h-3 w-3" />
        {pack.song.title} ({pack.song.kind})
      </p>
    </div>
  )
}
