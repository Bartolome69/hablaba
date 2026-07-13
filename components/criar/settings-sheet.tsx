"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Check, Loader2, Volume2 } from "lucide-react"
import { usePostHog } from "posthog-js/react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { playAudio, ttsUrl } from "@/lib/audio"
import { voices, type VoiceId } from "@/lib/voices"
import { useVoicePreference } from "@/hooks/use-voice-preference"
import type { CriarChild } from "@/lib/criar/types"
import { saveChild } from "@/lib/criar/store"

// Preview line uses the Rioplatense register — this is how the voice will
// actually sound in packs and sparring, unlike the main app's neutral sample.
const SAMPLE_TEXT = "Vení, upa, que te llevo a upa. Dale, mi amor."

interface SettingsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  child: CriarChild
  onChildUpdate: (child: CriarChild) => void
}

export function SettingsSheet({ open, onOpenChange, child, onChildUpdate }: SettingsSheetProps) {
  const { voiceId, setVoiceId } = useVoicePreference()
  const [previewingId, setPreviewingId] = useState<VoiceId | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const posthog = usePostHog()

  const stopPreview = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setPreviewingId(null)
  }, [])

  const preview = async (id: VoiceId) => {
    const wasPreviewing = previewingId === id
    stopPreview()
    if (wasPreviewing) return

    setPreviewingId(id)
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const audio = await playAudio(ttsUrl(SAMPLE_TEXT, id, "rioplatense"), controller.signal)
      if (controller.signal.aborted) {
        audio.pause()
        return
      }
      audioRef.current = audio
      audio.onended = () => {
        setPreviewingId(null)
        audioRef.current = null
      }
    } catch {
      if (controller.signal.aborted) return
      setPreviewingId(null)
    }
  }

  // Stop the preview when the sheet closes (or the component unmounts) so it
  // doesn't keep playing while the user is doing something else in the app.
  useEffect(() => {
    if (!open) stopPreview()
  }, [open, stopPreview])
  useEffect(() => stopPreview, [stopPreview])

  const updateChild = (patch: Partial<Pick<CriarChild, "name" | "birthdate">>) => {
    const updated = { ...child, ...patch }
    saveChild(updated)
    onChildUpdate(updated)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85vh] gap-0 overflow-y-auto rounded-t-2xl px-6 pt-6 pb-8"
      >
        <SheetHeader className="p-0 text-left">
          <SheetTitle>Settings</SheetTitle>
        </SheetHeader>

        <div className="mt-5 space-y-7">
          <section className="space-y-3">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Baby</h3>
            <div>
              <label htmlFor="grow-child-name" className="mb-1.5 block text-xs text-muted-foreground">
                Name
              </label>
              <input
                id="grow-child-name"
                type="text"
                defaultValue={child.name}
                onBlur={(e) => {
                  const name = e.target.value.trim()
                  if (name && name !== child.name) updateChild({ name })
                }}
                className="w-full rounded-xl bg-secondary px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label htmlFor="grow-child-birthdate" className="mb-1.5 block text-xs text-muted-foreground">
                Birth date
              </label>
              <input
                id="grow-child-birthdate"
                type="date"
                defaultValue={child.birthdate}
                onChange={(e) => {
                  if (e.target.value) updateChild({ birthdate: e.target.value })
                }}
                className="w-full rounded-xl bg-secondary px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Voice</h3>
            <div className="space-y-2">
              {voices.map((voice) => {
                const isSelected = voiceId === voice.id
                const isPreviewing = previewingId === voice.id
                return (
                  <div
                    key={voice.id}
                    onClick={() => {
                      posthog.capture("voice_changed", { voice_id: voice.id, voice_name: voice.name, context: "criar" })
                      setVoiceId(voice.id)
                    }}
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition-all active:scale-[0.98] ${
                      isSelected ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-secondary/50"
                    }`}
                  >
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${isSelected ? "text-primary" : "text-foreground"}`}>
                        {voice.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{voice.descriptor}</p>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        preview(voice.id)
                      }}
                      className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                        isPreviewing
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {isPreviewing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Volume2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}
