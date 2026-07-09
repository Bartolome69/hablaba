"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { ChevronRight, MessageCircle } from "lucide-react"
import type { CriarCapture, CriarChild, CriarPack } from "@/lib/criar/types"
import { ensureSeeded } from "@/lib/criar/seed"
import { getPackByDate, listCaptures, todayKey } from "@/lib/criar/store"
import { CriarHeader } from "@/components/criar/criar-header"
import { CaptureButton } from "@/components/criar/capture-button"
import { PackGenerator } from "@/components/criar/pack-generator"
import { PackView } from "@/components/criar/pack-view"

export default function CriarHomePage() {
  const [child, setChild] = useState<CriarChild | null>(null)
  const [pack, setPack] = useState<CriarPack | null>(null)
  const [pendingCaptures, setPendingCaptures] = useState<CriarCapture[]>([])

  const refreshCaptures = useCallback((childId: string) => {
    setPendingCaptures(listCaptures(childId).filter((c) => c.status === "new"))
  }, [])

  // localStorage is client-only — load after mount to avoid hydration mismatch
  useEffect(() => {
    const seeded = ensureSeeded()
    setChild(seeded)
    setPack(getPackByDate(seeded.id, todayKey()))
    refreshCaptures(seeded.id)
  }, [refreshCaptures])

  if (!child) {
    return <div className="min-h-dvh bg-background" />
  }

  return (
    <div className="min-h-dvh bg-background px-4 py-6 pb-8">
      <CriarHeader child={child} />

      <CaptureButton childId={child.id} onCaptured={() => refreshCaptures(child.id)} />

      {pendingCaptures.length > 0 && (
        <div className="mb-4 rounded-xl bg-secondary/50 px-4 py-3">
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            Queued for your next pack
          </p>
          <ul className="space-y-0.5">
            {pendingCaptures.map((c) => (
              <li key={c.id} className="truncate text-sm text-foreground">
                &ldquo;{c.text}&rdquo;
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link
        href="/criar/sparring"
        className="mb-4 flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 transition-transform active:scale-[0.99]"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <MessageCircle className="h-4.5 w-4.5" />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-medium text-foreground">Sparring session</span>
          <span className="block text-xs text-muted-foreground">
            Hear your week&apos;s Spanish in someone else&apos;s voice · 5–10 min
          </span>
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Link>

      {pack ? (
        <PackView key={pack.id} pack={pack} />
      ) : (
        <PackGenerator child={child} onGenerated={setPack} />
      )}
    </div>
  )
}
