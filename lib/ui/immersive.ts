"use client"

// Immersive sessions (a quiz, a flashcard deck, Repasar, voice mode) hide the
// global "¿Cómo se dice?" bar: nothing should sit over the thing you're doing.
// A counter rather than a boolean, so two overlapping sessions can't unhide
// the bar early. No provider needed.

import { useEffect, useSyncExternalStore } from "react"

let count = 0
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Mark the screen immersive while `active` (call inside the session component). */
export function useImmersive(active = true) {
  useEffect(() => {
    if (!active) return
    count++
    emit()
    return () => {
      count--
      emit()
    }
  }, [active])
}

/** True while any immersive session is mounted. */
export function useIsImmersive(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => count > 0,
    () => false,
  )
}
