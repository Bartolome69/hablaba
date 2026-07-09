"use client"

import type { CriarChild } from "@/lib/criar/types"
import { describeAge } from "@/lib/criar/stage"

export function CriarHeader({ child }: { child: CriarChild }) {
  return (
    <header className="mb-6 flex items-end justify-between">
      <div>
        <h1 className="font-serif text-2xl text-foreground">Criar</h1>
        <p className="text-sm text-muted-foreground">
          {child.name} · {describeAge(child.birthdate)}
        </p>
      </div>
      <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
        Rioplatense
      </span>
    </header>
  )
}
