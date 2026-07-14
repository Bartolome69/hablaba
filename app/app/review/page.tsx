"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Bookmark, Trash2, GraduationCap } from "lucide-react"
import { usePostHog } from "posthog-js/react"
import { Button } from "@/components/ui/button"
import { FlashcardDeck } from "@/components/review/flashcard-deck"
import { useSavedPhrases } from "@/hooks/use-saved-phrases"
import type { PracticeResult, SavedPhrase } from "@/lib/types"

// Saved-phrase row with an inline delete confirmation, matching the
// "Pick up where you left off" cards (see components/home/continue-session.tsx).
function SavedPhraseRow({ phrase, onRemove }: { phrase: SavedPhrase; onRemove: () => void }) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (confirmDelete) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-3">
        <p className="text-sm text-foreground">Delete this phrase?</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setConfirmDelete(false)}
            className="px-3 py-1.5 text-xs font-medium rounded-full bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onRemove}
            className="px-3 py-1.5 text-xs font-medium rounded-full bg-destructive text-white hover:bg-destructive/90 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-lg p-3 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{phrase.spanish}</p>
        <p className="text-xs text-muted-foreground">{phrase.english || "—"}</p>
      </div>
      <button
        onClick={() => setConfirmDelete(true)}
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-secondary transition-colors"
        aria-label="Remove phrase"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}

export default function ReviewPage() {
  const router = useRouter()
  const posthog = usePostHog()
  const { phrases, recordPractice, removePhrase } = useSavedPhrases()
  const [practicing, setPracticing] = useState(false)

  const startPractice = () => {
    posthog.capture("review_started", { phrase_count: phrases.length })
    setPracticing(true)
  }

  const handleRecord = (id: string, result: PracticeResult) => {
    recordPractice(id, result)
    posthog.capture("flashcard_reviewed", { result })
  }

  return (
    <div className="min-h-dvh bg-background px-4 py-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => router.push("/app/practice")}
          className="w-9 h-9 -ml-1.5 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          aria-label="Back"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-serif text-xl font-semibold text-foreground">Review</h1>
      </div>

      {phrases.length === 0 ? (
        <div className="flex flex-col items-center text-center py-16">
          <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mb-4">
            <Bookmark className="w-6 h-6 text-muted-foreground" />
          </div>
          <h2 className="font-serif text-lg text-foreground mb-1">No phrases yet</h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            Save phrases while you chat — tap the bookmark on a message — and they&apos;ll show up here to
            practise.
          </p>
        </div>
      ) : practicing ? (
        <FlashcardDeck phrases={phrases} onRecord={handleRecord} onExit={() => setPracticing(false)} />
      ) : (
        <>
          <button
            onClick={startPractice}
            className="w-full mb-8 flex items-center gap-3 p-4 bg-primary text-primary-foreground rounded-2xl hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-primary-foreground/15 flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">Practise flashcards</p>
              <p className="text-xs opacity-75">
                {phrases.length} {phrases.length === 1 ? "phrase" : "phrases"} saved
              </p>
            </div>
          </button>

          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Bookmark className="w-4 h-4" />
              Saved phrases
            </h2>
            <span className="text-xs text-muted-foreground">{phrases.length} saved</span>
          </div>
          <div className="space-y-2">
            {phrases.map((phrase) => (
              <SavedPhraseRow key={phrase.id} phrase={phrase} onRemove={() => removePhrase(phrase.id)} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
