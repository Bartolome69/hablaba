"use client"

// The child-details portion of Settings for the Grow module. Rendered into the
// shared SettingsSheet's `growDetails` slot by CriarHeader, so the main app
// never imports Grow code (see lib/criar/README.md boundary rules).

import type { CriarChild } from "@/lib/criar/types"
import { saveChild } from "@/lib/criar/store"

interface GrowChildSettingsProps {
  child: CriarChild
  onChildUpdate: (child: CriarChild) => void
}

export function GrowChildSettings({ child, onChildUpdate }: GrowChildSettingsProps) {
  const updateChild = (patch: Partial<Pick<CriarChild, "name" | "birthdate">>) => {
    const updated = { ...child, ...patch }
    saveChild(updated)
    onChildUpdate(updated)
  }

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="grow-child-name" className="mb-1.5 block text-xs text-muted-foreground">
          Baby&apos;s name
        </label>
        <input
          id="grow-child-name"
          type="text"
          defaultValue={child.name}
          onBlur={(e) => {
            const name = e.target.value.trim()
            if (name && name !== child.name) updateChild({ name })
          }}
          className="w-full rounded-xl bg-secondary px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div>
        <label htmlFor="grow-child-birthdate" className="mb-1.5 block text-xs text-muted-foreground">
          Birth date
        </label>
        <input
          id="grow-child-birthdate"
          type="date"
          defaultValue={child.birthdate}
          onChange={(e) => {
            if (e.target.value) updateChild({ birthdate: e.target.value })
          }}
          className="w-full rounded-xl bg-secondary px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div>
        <span className="mb-1.5 block text-xs text-muted-foreground">Dialect</span>
        <div className="flex items-center justify-between rounded-xl bg-secondary px-4 py-2.5">
          <span className="text-sm text-foreground">Rioplatense</span>
          <span className="text-xs text-muted-foreground">Argentine Spanish</span>
        </div>
      </div>
    </div>
  )
}
