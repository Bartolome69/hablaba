"use client"

// The global "¿Cómo se dice?" sheet. Mounted once in the app layout and opened
// from the bar above the nav (or, in Phase 4, from a word in a chat bubble).

import { DuoIcon } from "@/components/icons"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { AskPanel } from "@/components/ask/ask-panel"
import { closeAskSheet, useAskSheet } from "@/lib/ask/sheet"

export function AskSheet() {
  const sheet = useAskSheet()

  return (
    <Sheet open={sheet.open} onOpenChange={(open) => !open && closeAskSheet()}>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[88dvh] max-w-lg overflow-y-auto rounded-t-[26px] border-rule bg-background px-[22px] pb-[max(env(safe-area-inset-bottom),24px)] pt-6 [&>button:last-child]:hidden"
      >
        {/* Our own close: 44px and labelled in Spanish (the built-in X is 16px). */}
        <SheetClose
          aria-label="Cerrar"
          className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full text-ink-muted"
        >
          <DuoIcon name="volver" size={18} className="rotate-[-90deg]" />
        </SheetClose>
        <SheetHeader className="mb-4 p-0 pr-10 text-left">
          <SheetTitle className="font-serif text-[22px] font-normal tracking-[-0.015em] text-ink">
            ¿Cómo se dice…?
          </SheetTitle>
          <SheetDescription className="text-[13px] text-ink-muted">
            Una palabra o una frase, en inglés o en español.
          </SheetDescription>
        </SheetHeader>
        <AskPanel
          key={sheet.key}
          variant="sheet"
          initialQuery={sheet.query}
          context={sheet.context}
          autoFocus={!sheet.query}
          onClose={closeAskSheet}
        />
      </SheetContent>
    </Sheet>
  )
}
