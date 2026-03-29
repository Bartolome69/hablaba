"use client"

import { useRef, useState } from "react"
import { Volume2, Loader2, Check } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { voices, type VoiceId } from "@/lib/voices"
import { useVoicePreference } from "@/hooks/use-voice-preference"

const SAMPLE_TEXT = "Hola, ¿cómo estás? Me alegra practicar español contigo."

interface VoiceSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VoiceSheet({ open, onOpenChange }: VoiceSheetProps) {
  const { voiceId, setVoiceId } = useVoicePreference()
  const [previewingId, setPreviewingId] = useState<VoiceId | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const preview = async (id: VoiceId) => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (previewingId === id) {
      setPreviewingId(null)
      return
    }

    setPreviewingId(id)
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: SAMPLE_TEXT, voice: id }),
      })
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => { setPreviewingId(null); URL.revokeObjectURL(url); audioRef.current = null }
      audio.onerror = () => { setPreviewingId(null); audioRef.current = null }
      audio.play()
    } catch {
      setPreviewingId(null)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-8">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-left">Choose a voice</SheetTitle>
        </SheetHeader>

        <div className="space-y-2">
          {voices.map((voice) => {
            const isSelected = voiceId === voice.id
            const isPreviewing = previewingId === voice.id
            return (
              <div
                key={voice.id}
                onClick={() => setVoiceId(voice.id)}
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
      </SheetContent>
    </Sheet>
  )
}
