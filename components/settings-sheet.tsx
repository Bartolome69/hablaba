"use client"

// Settings + Profile: TTS voice, and the set-once configuration that shapes
// every conversation — dialect, correction style, child details. Opened from
// the header gear; the IA plan later gives Profile its own header icon, but
// the content lives here either way.

import { useCallback, useEffect, useRef, useState } from "react"
import { DuoIcon } from "@/components/icons"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { playAudio, ttsUrl } from "@/lib/audio"
import { getVoice, voices, type VoiceId } from "@/lib/voices"
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
  const { voiceId, setVoiceId, readAloud, setReadAloud } = useVoicePreference()
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
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-[26px] border-rule bg-background px-6 pt-6 pb-8">
        <SheetHeader className="mb-5 p-0 text-left">
          <SheetTitle className="font-serif text-[22px] font-normal tracking-[-0.015em] text-ink">
            Ajustes
          </SheetTitle>
        </SheetHeader>

        {profile && (
          <>
            <h3 className="smallcaps mb-3 text-ink-faint">Spanish</h3>
            <div className="mb-4 grid grid-cols-2 gap-2">
              {DIALECT_OPTIONS.map((d) => {
                const selected = profile.dialect === d.id
                return (
                  <button
                    key={d.id}
                    onClick={() => patchProfile({ dialect: d.id })}
                    aria-pressed={selected}
                    className={`rounded-[18px] p-3 text-left transition-all duration-[120ms] active:scale-[0.98] ${
                      selected ? "bg-[#EAF1EA]" : "clay-card"
                    }`}
                    style={selected ? { boxShadow: "inset 0 0 0 1.5px var(--hb-green), 0 2px 0 #CFDECF" } : undefined}
                  >
                    <p className={`text-sm font-semibold ${selected ? "text-green" : "text-ink"}`}>
                      {d.label}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-soft">{d.blurb}</p>
                  </button>
                )
              })}
            </div>

            <div className="mb-1 flex items-center gap-2">
              <span className="text-xs font-medium text-ink-muted">Corrígeme</span>
              <div className="clay-recessed flex flex-1 gap-1 rounded-full p-1">
                {CORRECTION_OPTIONS.map((level) => (
                  <button
                    key={level}
                    onClick={() => patchProfile({ correctionLevel: level })}
                    aria-pressed={profile.correctionLevel === level}
                    className={`flex-1 rounded-full py-1.5 text-center text-xs font-medium transition-colors ${
                      profile.correctionLevel === level
                        ? "bg-green text-cream"
                        : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <h3 className="smallcaps mb-3 mt-7 text-ink-faint">Your little one</h3>
            <p className="mb-3 text-xs text-ink-soft">
              Optional — with a child set, she can talk about your day with them by name.
            </p>
            <div className="space-y-3">
              <div>
                <label htmlFor="profile-child-name" className="mb-1.5 block text-xs text-ink-muted">
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
                  className="clay-recessed w-full rounded-[14px] px-3.5 py-2.5 text-sm text-ink outline-none focus:ring-1 focus:ring-green/40"
                />
              </div>
              <div>
                <label htmlFor="profile-child-birthdate" className="mb-1.5 block text-xs text-ink-muted">
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
                  className="clay-recessed w-full rounded-[14px] px-3.5 py-2.5 text-sm text-ink outline-none focus:ring-1 focus:ring-green/40"
                />
              </div>
            </div>
          </>
        )}

        <h3 className="smallcaps mb-3 mt-7 text-ink-faint">Voice</h3>
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
                className={`flex cursor-pointer items-center gap-3 rounded-[18px] p-3 transition-all duration-[120ms] active:scale-[0.98] ${
                  isSelected ? "bg-[#EAF1EA]" : "clay-card"
                }`}
                style={isSelected ? { boxShadow: "inset 0 0 0 1.5px var(--hb-green), 0 2px 0 #CFDECF" } : undefined}
              >
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${isSelected ? "text-green" : "text-ink"}`}>
                    {voice.name}
                  </p>
                  <p className="text-xs text-ink-soft">{voice.descriptor}</p>
                </div>

                {isSelected && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green">
                    <DuoIcon name="check" size={12} className="text-cream" />
                  </span>
                )}

                <button
                  onClick={(e) => { e.stopPropagation(); preview(voice.id) }}
                  aria-label={`Preview ${voice.name}`}
                  className={`press-disc flex h-9 w-9 items-center justify-center rounded-full ${
                    isPreviewing ? "bg-green text-cream" : "bg-sunken-2 text-ink"
                  }`}
                >
                  <DuoIcon
                    name="escuchar"
                    size={16}
                    detail={isPreviewing ? "#8FBE9C" : undefined}
                    className={isPreviewing ? "animate-pulse" : undefined}
                  />
                </button>
              </div>
            )
          })}
        </div>

        {/* Off by default, and the copy says what it does rather than naming a
            feature — the parent needs to know whether the phone is about to
            make noise. Voice mode speaks regardless; this is text chat only. */}
        <div className="clay-card mt-3 flex items-center gap-3 rounded-[18px] p-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink">Leer las respuestas</p>
            <p className="text-xs leading-snug text-ink-soft">
              En el chat escrito, {getVoice(voiceId).name} lee sus mensajes sola.
            </p>
          </div>
          <button
            role="switch"
            aria-checked={readAloud}
            aria-label="Leer las respuestas en voz alta"
            onClick={() => {
              posthog.capture("read_aloud_toggled", { on: !readAloud })
              setReadAloud(!readAloud)
            }}
            className={`relative h-[30px] w-[52px] flex-none rounded-full transition-colors duration-[120ms] ${
              readAloud ? "bg-green" : "bg-sunken-2"
            }`}
            style={{ boxShadow: readAloud ? "0 2px 0 var(--hb-green-press)" : "inset 0 2px 4px rgba(30,61,44,.08)" }}
          >
            <span
              className="absolute top-[3px] h-6 w-6 rounded-full bg-surface transition-[left] duration-[120ms]"
              style={{ left: readAloud ? 25 : 3, boxShadow: "0 1px 2px rgba(30,61,44,.18)" }}
            />
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
