"use client"

import { useCallback, useEffect, useState } from "react"
import type { CriarCapture, CriarChild, CriarPack } from "@/lib/criar/types"
import { ensureSeeded } from "@/lib/criar/seed"
import { getPackByDate, listCaptures, todayKey } from "@/lib/criar/store"
import { AppTabs } from "@/components/app-tabs"
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
    <div className="min-h-dvh bg-background px-4 py-6 pb-24">
      <div className="mb-6">
        <AppTabs />
      </div>
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

      {pack ? (
        <PackView key={pack.id} pack={pack} />
      ) : (
        <PackGenerator child={child} onGenerated={setPack} />
      )}
    </div>
  )
}
