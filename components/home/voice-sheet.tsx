"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Volume2, Loader2, Check } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { playAudio, ttsUrl } from "@/lib/audio"
import { voices, type VoiceId } from "@/lib/voices"
import { useVoicePreference } from "@/hooks/use-voice-preference"
import { isCriarEnabled, setCriarEnabled } from "@/lib/criar-flag"
import { usePostHog } from "posthog-js/react"

const SAMPLE_TEXT = "Hola, ¿cómo estás? Me alegra practicar español contigo."

interface VoiceSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VoiceSheet({ open, onOpenChange }: VoiceSheetProps) {
  const { voiceId, setVoiceId } = useVoicePreference()
  const [previewingId, setPreviewingId] = useState<VoiceId | null>(null)
  const [growEnabled, setGrowEnabled] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const posthog = usePostHog()

  // Reflect the current flag each time the sheet opens.
  useEffect(() => {
    if (open) setGrowEnabled(isCriarEnabled())
  }, [open])

  const toggleGrow = (next: boolean) => {
    setGrowEnabled(next)
    setCriarEnabled(next)
    posthog.capture(next ? "criar_unlocked" : "criar_disabled", { source: "settings" })
  }

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
      const audio = await playAudio(ttsUrl(SAMPLE_TEXT, id), controller.signal)
      if (controller.signal.aborted) {
        audio.pause()
        return
      }
      audioRef.current = audio
      audio.onended = () => { setPreviewingId(null); audioRef.current = null }
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl px-6 pt-6 pb-8">
        <SheetHeader className="mb-5 p-0 text-left">
          <SheetTitle>Settings</SheetTitle>
        </SheetHeader>

        <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Voice</h3>
        <div className="space-y-2">
          {voices.map((voice) => {
            const isSelected = voiceId === voice.id
            const isPreviewing = previewingId === voice.id
            return (
              <div
                key={voice.id}
                onClick={() => {
                  posthog.capture("voice_changed", { voice_id: voice.id, voice_name: voice.name })
                  setVoiceId(voice.id)
                }}
                className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all active:scale-[0.98] ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:bg-secondary/50"
                }`}
              >
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${isSelected ? "text-primary" : "text-foreground"}`}>
                    {voice.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{voice.descriptor}</p>
                </div>

                {isSelected && (
                  <Check className="w-4 h-4 text-primary" />
                )}

                <button
                  onClick={(e) => { e.stopPropagation(); preview(voice.id) }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    isPreviewing
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isPreviewing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            )
          })}
        </div>

        <h3 className="mb-3 mt-7 text-xs font-medium uppercase tracking-wide text-muted-foreground">Grow</h3>
        <label
          htmlFor="grow-toggle"
          className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-card p-4"
        >
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Bilingual parenting</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              A daily Rioplatense phrase pack for talking to your little one. Adds a Grow tab.
            </p>
          </div>
          <Switch id="grow-toggle" checked={growEnabled} onCheckedChange={toggleGrow} />
        </label>
      </SheetContent>
    </Sheet>
  )
}
