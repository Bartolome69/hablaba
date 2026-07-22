"use client"

import { useState } from "react"
import { Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { usePostHog } from "posthog-js/react"
import type { CriarChild, CriarMomentId, CriarPack, PackApiResponse } from "@/lib/criar/types"
import { deriveStage, describeAge, stageMoments } from "@/lib/criar/stage"
import {
  learnedPhraseTexts,
  listCaptures,
  markCapturesTaught,
  savePack,
  todayKey,
  unlearnedRecentPhraseTexts,
} from "@/lib/criar/store"

interface PackGeneratorProps {
  child: CriarChild
  onGenerated: (pack: CriarPack) => void
}

export function PackGenerator({ child, onGenerated }: PackGeneratorProps) {
  const stage = deriveStage(child.birthdate)
  const moments = stageMoments[stage]
  const [moment, setMoment] = useState<CriarMomentId>(moments[0]?.id ?? "waking")
  const [isGenerating, setIsGenerating] = useState(false)
  const posthog = usePostHog()

  const pendingCaptures = listCaptures(child.id).filter((c) => c.status === "new")

  const generate = async () => {
    setIsGenerating(true)
    try {
      const res = await fetch("/api/criar/pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childName: child.name,
          ageDescription: describeAge(child.birthdate),
          stage,
          moment,
          captures: pendingCaptures.map((c) => ({ id: c.id, text: c.text })),
          reinforcePhrases: unlearnedRecentPhraseTexts(child.id),
          avoidPhrases: learnedPhraseTexts(child.id),
        }),
      })
      if (!res.ok) throw new Error(`Pack API error: ${res.status}`)
      const data: PackApiResponse = await res.json()

      const pack: CriarPack = {
        id: crypto.randomUUID(),
        childId: child.id,
        date: todayKey(),
        stage,
        moment,
        phrases: data.phrases.map((p) => ({
          id: crypto.randomUUID(),
          spanish: p.spanish,
          english: p.english,
          note: p.note,
          learned: false,
        })),
        story: data.story,
        song: data.song,
        captureLessons: data.captureLessons,
        createdAt: new Date().toISOString(),
      }
      savePack(pack)
      markCapturesTaught(data.captureLessons.map((l) => l.captureId), pack.id)
      posthog.capture("criar_pack_generated", {
        moment,
        stage,
        phrase_count: pack.phrases.length,
        capture_lesson_count: pack.captureLessons.length,
      })
      onGenerated(pack)
    } catch (err) {
      console.error("[PackGenerator]", err)
      toast.error("No se pudo generar el pack", {
        description: "Check your connection and try again.",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h2 className="font-serif text-lg text-foreground mb-1">Today&apos;s pack</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Pick the moment you want phrases for today.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {moments.map((m) => {
          const isActive = m.id === moment
          return (
            <button
              key={m.id}
              onClick={() => setMoment(m.id)}
              disabled={isGenerating}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              <span className="mr-1.5">{m.emoji}</span>
              {m.label}
            </button>
          )
        })}
      </div>

      {pendingCaptures.length > 0 && (
        <p className="mb-4 text-xs text-muted-foreground">
          {pendingCaptures.length === 1
            ? "1 capture will be woven in as a mini-lesson."
            : `${pendingCaptures.length} captures will be woven in as mini-lessons.`}
        </p>
      )}

      <button
        onClick={generate}
        disabled={isGenerating}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-60"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Generate today&apos;s pack
          </>
        )}
      </button>
    </div>
  )
}
