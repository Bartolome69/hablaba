"use client"

// Settings + Profile: TTS voice, and the set-once configuration that shapes
// every conversation — dialect, correction style, child details. Opened from
// the header gear; the IA plan later gives Profile its own header icon, but
// the content lives here either way.

import { useCallback, useEffect, useRef, useState } from "react"
import { Volume2, Loader2, Check } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { playAudio, ttsUrl } from "@/lib/audio"
import { voices, type VoiceId } from "@/lib/voices"
import { useVoicePreference } from "@/hooks/use-voice-preference"
import {
  getProfile,
  saveProfile,
  type CorrectionLevel,
  type Profile,
  type SpanishDialect,
} from "@/lib/profile/store"
import { usePostHog } from "posthog-js/react"

const SAMPLE_TEXT = "Hola, ¿cómo estás? Me alegra practicar español contigo."

const CORRECTION_OPTIONS: CorrectionLevel[] = ["mucho", "normal", "poco"]

const DIALECT_OPTIONS: { id: SpanishDialect; label: string; blurb: string }[] = [
  { id: "rioplatense", label: "Rioplatense", blurb: "Argentine vocabulary, porteño accent" },
  { id: "neutral", label: "Neutral", blurb: "Widely understood Latin American" },
]

interface SettingsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsSheet({ open, onOpenChange }: SettingsSheetProps) {
  const { voiceId, setVoiceId } = useVoicePreference()
  const [previewingId, setPreviewingId] = useState<VoiceId | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const posthog = usePostHog()

  // Re-read each time the sheet opens — another surface may have migrated data in.
  useEffect(() => {
    if (open) setProfile(getProfile())
  }, [open])

  const patchProfile = useCallback(
    (patch: Partial<Profile>) => {
      saveProfile(patch)
      setProfile(getProfile())
      posthog.capture("profile_updated", { fields: Object.keys(patch) })
    },
    [posthog],
  )

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

        {profile && (
          <>
            <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Spanish
            </h3>
            <div className="mb-4 grid grid-cols-2 gap-2">
              {DIALECT_OPTIONS.map((d) => {
                const selected = profile.dialect === d.id
                return (
                  <button
                    key={d.id}
                    onClick={() => patchProfile({ dialect: d.id })}
                    aria-pressed={selected}
                    className={`rounded-2xl border p-3 text-left transition-all active:scale-[0.98] ${
                      selected ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-secondary/50"
                    }`}
                  >
                    <p className={`text-sm font-semibold ${selected ? "text-primary" : "text-foreground"}`}>
                      {d.label}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{d.blurb}</p>
                  </button>
                )
              })}
            </div>

            <div className="mb-1 flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Corrígeme</span>
              <div className="flex flex-1 gap-1 rounded-full bg-secondary p-1">
                {CORRECTION_OPTIONS.map((level) => (
                  <button
                    key={level}
                    onClick={() => patchProfile({ correctionLevel: level })}
                    aria-pressed={profile.correctionLevel === level}
                    className={`flex-1 rounded-full py-1.5 text-center text-xs font-medium transition-colors ${
                      profile.correctionLevel === level
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <h3 className="mb-3 mt-7 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Your little one
            </h3>
            <p className="mb-3 text-xs text-muted-foreground">
              Optional — with a child set, she can talk about your day with them by name.
            </p>
            <div className="space-y-3">
              <div>
                <label htmlFor="profile-child-name" className="mb-1.5 block text-xs text-muted-foreground">
                  Name
                </label>
                <input
                  id="profile-child-name"
                  type="text"
                  defaultValue={profile.child?.name ?? ""}
                  onBlur={(e) => {
                    const name = e.target.value.trim()
                    if (name !== (profile.child?.name ?? "")) {
                      patchProfile({
                        child: name ? { name, birthdate: profile.child?.birthdate ?? "" } : null,
                      })
                    }
                  }}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                />
              </div>
              <div>
                <label htmlFor="profile-child-birthdate" className="mb-1.5 block text-xs text-muted-foreground">
                  Birthdate
                </label>
                <input
                  id="profile-child-birthdate"
                  type="date"
                  defaultValue={profile.child?.birthdate ?? ""}
                  onBlur={(e) => {
                    const birthdate = e.target.value
                    if (profile.child?.name && birthdate !== profile.child.birthdate) {
                      patchProfile({ child: { name: profile.child.name, birthdate } })
                    }
                  }}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                />
              </div>
            </div>
          </>
        )}

        <h3 className="mb-3 mt-7 text-xs font-medium uppercase tracking-wide text-muted-foreground">Voice</h3>
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

                {isSelected && <Check className="w-4 h-4 text-primary" />}

                <button
                  onClick={(e) => { e.stopPropagation(); preview(voice.id) }}
                  aria-label={`Preview ${voice.name}`}
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
