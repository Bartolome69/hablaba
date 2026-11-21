"use client"

// Prepare a captured or picked photo: decode it (honouring EXIF rotation),
// downscale to a 1600 px long edge for OCR and keeping, and make a small
// thumbnail for the shelf. Both are JPEG Blobs, never data URLs.

export const LONG_EDGE = 1600
export const THUMB_EDGE = 240

export class UnreadableImageError extends Error {
  constructor() {
    super("unreadable image")
    this.name = "UnreadableImageError"
  }
}

async function decode(blob: Blob): Promise<ImageBitmap | HTMLImageElement> {
  try {
    return await createImageBitmap(blob, { imageOrientation: "from-image" })
  } catch {
    // Older Safari: no options bag, or a format createImageBitmap won't take.
    const url = URL.createObjectURL(blob)
    try {
      const img = new Image()
      img.src = url
      await img.decode()
      return img
    } catch {
      throw new UnreadableImageError()
    } finally {
      URL.revokeObjectURL(url)
    }
  }
}

function size(source: ImageBitmap | HTMLImageElement) {
  return source instanceof HTMLImageElement
    ? { w: source.naturalWidth, h: source.naturalHeight }
    : { w: source.width, h: source.height }
}

function render(source: ImageBitmap | HTMLImageElement, longEdge: number, quality: number): Promise<Blob> {
  const { w, h } = size(source)
  const scale = Math.min(1, longEdge / Math.max(w, h))
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(w * scale))
  canvas.height = Math.max(1, Math.round(h * scale))
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new UnreadableImageError()
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new UnreadableImageError())), "image/jpeg", quality),
  )
}

export async function preparePhoto(input: Blob): Promise<{ photo: Blob; thumb: Blob }> {
  const source = await decode(input)
  try {
    const [photo, thumb] = await Promise.all([render(source, LONG_EDGE, 0.82), render(source, THUMB_EDGE, 0.7)])
    return { photo, thumb }
  } finally {
    if ("close" in source) source.close()
  }
}
