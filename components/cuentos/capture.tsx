"use client"

// Taking the photo. The camera (getUserMedia) with a frame guide and a big
// shutter, a torch where the phone has one (Android), and ALWAYS "Elegir de
// las fotos": a file input that is also the dependable iPhone path. No live
// overlay translation; one still, confirmed before it's used.

import { useCallback, useEffect, useRef, useState } from "react"
import { DuoIcon } from "@/components/icons"
import { Spinner, useBlobUrl } from "./shared"

type CameraState = "starting" | "live" | "unavailable"

export function Capture({
  onPhoto,
  onCancel,
  pageLabel,
}: {
  onPhoto: (photo: Blob) => void
  onCancel: () => void
  pageLabel: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [camera, setCamera] = useState<CameraState>("starting")
  const [torch, setTorch] = useState<boolean | null>(null) // null: no torch on this phone
  const [still, setStill] = useState<Blob | null>(null)
  const stillUrl = useBlobUrl(still)

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamera("unavailable")
      return
    }
    setCamera("starting")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1440 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
      }
      const track = stream.getVideoTracks()[0]
      const caps = (track.getCapabilities?.() ?? {}) as MediaTrackCapabilities & { torch?: boolean }
      setTorch(caps.torch ? false : null)
      setCamera("live")
    } catch {
      setCamera("unavailable")
    }
  }, [])

  useEffect(() => {
    void startCamera()
    return stopCamera
  }, [startCamera, stopCamera])

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track || torch === null) return
    try {
      await track.applyConstraints({ advanced: [{ torch: !torch } as MediaTrackConstraintSet] })
      setTorch(!torch)
    } catch {
      setTorch(null)
    }
  }

  const shoot = () => {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext("2d")?.drawImage(video, 0, 0)
    canvas.toBlob((blob) => blob && setStill(blob), "image/jpeg", 0.92)
  }

  const picked = (file: File | undefined) => {
    if (file) setStill(file)
  }

  const retake = () => {
    setStill(null)
    if (!streamRef.current) void startCamera()
  }

  const use = () => {
    if (!still) return
    stopCamera()
    onPhoto(still)
  }

  return (
    <div className="fixed inset-0 z-50 mx-auto flex max-w-lg flex-col bg-green-press text-cream">
      <div className="flex items-center justify-between px-4" style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}>
        <button
          onClick={() => {
            stopCamera()
            onCancel()
          }}
          className="flex h-11 items-center px-2 text-[15px] font-medium text-green-on-dark"
        >
          Cancelar
        </button>
        <p className="text-[14px] font-medium text-green-on-dark">{pageLabel}</p>
        {torch !== null && !still ? (
          <button
            onClick={toggleTorch}
            aria-pressed={torch}
            className={`flex h-11 items-center gap-1.5 rounded-full px-3 text-[14px] font-medium ${torch ? "bg-cream text-ink" : "text-green-on-dark"}`}
          >
            <DuoIcon name="rayo" size={16} />
            Luz
          </button>
        ) : (
          <span className="w-16" />
        )}
      </div>

      <div className="relative mx-4 mt-3 flex-1 overflow-hidden rounded-[20px] bg-black/30">
        {stillUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={stillUrl} alt="La foto de la página" className="h-full w-full object-contain" />
        ) : (
          <>
            <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
            {camera === "live" && (
              <div aria-hidden className="pointer-events-none absolute inset-5 rounded-[14px] border-2 border-dashed border-cream/70" />
            )}
            {camera === "starting" && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Spinner light />
              </div>
            )}
            {camera === "unavailable" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-8 text-center">
                <p className="font-serif text-[20px] leading-snug">Elige la foto de la página.</p>
                <p className="text-[13px] text-green-on-dark">
                  Si quieres usar la cámara aquí, permítela en el navegador.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <p className="mt-3 px-6 text-center text-[13.5px] text-green-on-dark">
        {still ? "¿Se lee bien?" : "Que la página llene el cuadro. Quieto. Una foto."}
      </p>

      <div className="px-4 pt-4" style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}>
        {still ? (
          <div className="flex gap-3">
            <button onClick={retake} className="flex h-14 flex-1 items-center justify-center rounded-full text-[16px] font-semibold" style={{ boxShadow: "inset 0 0 0 1.5px rgba(247,243,236,.35)" }}>
              Otra vez
            </button>
            <button onClick={use} className="flex h-14 flex-[1.4] items-center justify-center rounded-full bg-cream text-[16px] font-semibold text-ink">
              Usar esta foto
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex h-14 items-center justify-center rounded-full px-3 text-[14px] font-semibold leading-tight"
              style={{ boxShadow: "inset 0 0 0 1.5px rgba(247,243,236,.35)" }}
            >
              Elegir de las fotos
            </button>
            <button
              onClick={shoot}
              disabled={camera !== "live"}
              aria-label="Sacar la foto"
              className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-cream disabled:opacity-40"
            >
              <span className="h-[62px] w-[62px] rounded-full border-[3px] border-green-press" />
            </button>
            <span />
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          // No `capture` attribute: with it Android jumps straight to the
          // camera and never shows the gallery. Without it, iPhone offers
          // library, camera or files, and Android its picker.
          className="hidden"
          onChange={(e) => {
            picked(e.target.files?.[0])
            e.target.value = ""
          }}
        />
      </div>
    </div>
  )
}
