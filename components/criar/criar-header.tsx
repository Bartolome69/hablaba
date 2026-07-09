"use client"

import Link from "next/link"
import { BookOpen } from "lucide-react"
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
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
          Rioplatense
        </span>
        <Link
          href="/criar/journal"
          aria-label="Journal"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground active:opacity-70 transition-opacity"
        >
          <BookOpen className="h-4 w-4" />
        </Link>
      </div>
    </header>
  )
}
