"use client"

// What Cuentos does with photos and text, and the personal-use note. Shown on
// the first open of the shelf, and from Ajustes. Plain, short, tú.

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"

export const PRIVACY_SEEN_KEY = "cuentos_note_seen"

export function PrivacyPoints() {
  return (
    <ul className="space-y-2.5 text-[14px] leading-snug text-ink">
      <li>Las fotos y los textos quedan en este teléfono.</li>
      <li>
        Para leer una foto o traducir una página, la mandamos a nuestro proveedor de IA solo para ese trabajo. No
        la guardamos.
      </li>
      <li>Sin cuenta y sin publicidad.</li>
      <li>
        Úsalo con libros que tienes, para leer en casa. No compartas ni publiques las traducciones.
      </li>
      <li className="text-ink-muted">
        En iPhone, agrega Hablaba a la pantalla de inicio para que tus cuentos queden guardados.
      </li>
    </ul>
  )
}

export function PrivacyNoteSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        className="mx-auto max-w-lg rounded-t-[26px] border-rule bg-background px-[22px] pb-[max(env(safe-area-inset-bottom),24px)] pt-6 [&>button:last-child]:hidden"
      >
        <SheetHeader className="mb-4 p-0 text-left">
          <SheetTitle className="font-serif text-[22px] font-normal tracking-[-0.015em] text-ink">
            Tus cuentos, en tu teléfono
          </SheetTitle>
          <SheetDescription className="sr-only">Privacidad y uso personal</SheetDescription>
        </SheetHeader>
        <PrivacyPoints />
        <button
          onClick={onClose}
          className="clay-green mt-6 flex h-12 w-full items-center justify-center rounded-full text-[15px] font-semibold text-cream"
        >
          Entendido
        </button>
      </SheetContent>
    </Sheet>
  )
}
