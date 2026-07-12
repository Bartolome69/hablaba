"use client"

import { useCallback, useState } from "react"
import { Mic, Square, Zap } from "lucide-react"
import { toast } from "sonner"
import { usePostHog } from "posthog-js/react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { useRecorder } from "@/hooks/use-recorder"
import { addCapture } from "@/lib/criar/store"

interface CaptureButtonProps {
  childId: string
  onCaptured?: () => void
}

export function CaptureButton({ childId, onCaptured }: CaptureButtonProps) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")
  const posthog = usePostHog()

  const handleTranscript = useCallback((text: string) => {
    setValue((current) => (current ? `${current} ${text}` : text))
  }, [])

  // Captures come out in English, Spanish or a mix — let the model detect
  const { state: recState, error: recError, start, stop, cancel } = useRecorder(
    handleTranscript,
    { language: "auto" },
  )

  const isRecording = recState === "recording"
  const isTranscribing = recState === "transcribing"

  const save = () => {
    if (!value.trim()) return
    addCapture(childId, value.trim())
    posthog.capture("criar_capture_added", { length: value.trim().length })
    setValue("")
    setOpen(false)
    onCaptured?.()
    toast.success("Captured", {
      description: "It'll be woven into your next pack as a mini-lesson.",
    })
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next && isRecording) cancel()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mb-4 flex w-full items-center gap-3 rounded-2xl bg-primary px-4 py-4 text-left text-primary-foreground shadow-sm transition-transform active:scale-[0.99]"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15">
          <Zap className="h-5 w-5" />
        </span>
        <span>
          <span className="block text-sm font-semibold">Couldn&apos;t say something?</span>
          <span className="block text-xs opacity-80">
            Capture it now — tomorrow&apos;s pack will teach it back.
          </span>
        </span>
      </button>

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl px-6 pt-6"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)" }}
        >
          <SheetHeader className="mb-3 p-0 pr-8 text-left">
            <SheetTitle>What couldn&apos;t you say?</SheetTitle>
            <SheetDescription>
              In English, Spanish or a mix — whatever came out in the moment.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-3">
            {recError && <p className="text-xs text-destructive">{recError}</p>}
            {isRecording ? (
              <div className="flex items-center gap-3 rounded-xl bg-secondary px-4 py-3">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-destructive" />
                <span className="text-sm text-muted-foreground">Listening…</span>
              </div>
            ) : (
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={isTranscribing ? "Transcribing…" : 'e.g. "does he need burping?"'}
                disabled={isTranscribing}
                autoFocus
                rows={2}
                enterKeyHint="done"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    save()
                  }
                }}
                className="w-full resize-none rounded-xl bg-secondary px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
              />
            )}
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant={isRecording ? "destructive" : "secondary"}
                className="h-11 w-11 shrink-0 rounded-full"
                onClick={isRecording ? stop : start}
                disabled={isTranscribing}
                aria-label={isRecording ? "Stop recording" : "Dictate"}
              >
                {isRecording ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-5 w-5" />}
              </Button>
              <Button
                className="h-11 flex-1 rounded-full"
                onClick={save}
                disabled={!value.trim() || isRecording || isTranscribing}
              >
                Save capture
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
