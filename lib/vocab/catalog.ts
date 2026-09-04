// Typed access over the authored vocabulary sets. Content is versioned JSON in
// the repo (see lib/vocab/README.md) — static, offline, and in the bundle. The
// sets never change at runtime; only the learner's own list does.

import animales from "./content/animales.json"
import comida from "./content/comida.json"
import cuerpo from "./content/cuerpo.json"
import type { CatalogWord, VocabSet, VocabSetId } from "./types"

/** Display order on the chip row. `propias` is last — it's the learner's own. */
export const SET_ORDER: VocabSetId[] = ["cuerpo", "animales", "comida", "propias"]

export const SETS: Record<Exclude<VocabSetId, "propias">, VocabSet> = {
  cuerpo: {
    id: "cuerpo",
    label: "El cuerpo",
    blurb: "Every part, with the article that goes with it",
    words: cuerpo as CatalogWord[],
    groups: [
      { id: "cabeza", label: "La cabeza" },
      { id: "tronco", label: "El cuerpo" },
      { id: "brazos", label: "Los brazos" },
      { id: "piernas", label: "Las piernas" },
    ],
  },
  animales: {
    id: "animales",
    label: "Los animales",
    blurb: "Pets, the farm, the wild and the garden",
    words: animales as CatalogWord[],
    groups: [
      { id: "casa", label: "En casa" },
      { id: "campo", label: "En el campo" },
      { id: "salvajes", label: "Salvajes" },
      { id: "jardin", label: "En el jardín" },
    ],
  },
  comida: {
    id: "comida",
    label: "La comida",
    blurb: "What ends up on the highchair tray",
    words: comida as CatalogWord[],
    groups: [
      { id: "frutas", label: "Frutas" },
      { id: "verduras", label: "Verduras" },
      { id: "basicos", label: "Básicos" },
      { id: "bebidas", label: "Para tomar" },
      { id: "dulces", label: "Dulces" },
    ],
  },
}

/** Every authored word, flat — used for the word of the day and id lookup. */
export const allCatalogWords: CatalogWord[] = SET_ORDER.flatMap((id) =>
  id === "propias" ? [] : SETS[id].words,
)

const byId = new Map(allCatalogWords.map((w) => [w.id, w]))

export function getCatalogWord(id: string): CatalogWord | undefined {
  return byId.get(id)
}

export function getSet(id: VocabSetId): VocabSet | undefined {
  return id === "propias" ? undefined : SETS[id]
}

/** The set a catalog id belongs to, derived from its prefix. */
export function setOfCatalogWord(id: string): VocabSetId | undefined {
  return (Object.keys(SETS) as (keyof typeof SETS)[]).find((set) =>
    SETS[set].words.some((w) => w.id === id),
  )
}

/** A set's words, grouped in the set's declared group order. */
export function wordsByGroup(set: VocabSet): { id: string; label: string; words: CatalogWord[] }[] {
  if (!set.groups) return [{ id: "all", label: set.label, words: set.words }]
  return set.groups
    .map((g) => ({ ...g, words: set.words.filter((w) => w.group === g.id) }))
    .filter((g) => g.words.length > 0)
}

/** Rotates once a day, same for the whole day — mirrors the phrase of the day. */
export function wordOfTheDay(now = new Date()): CatalogWord {
  const start = new Date(now.getFullYear(), 0, 0)
  const day = Math.floor((now.getTime() - start.getTime()) / 86_400_000)
  return allCatalogWords[day % allCatalogWords.length]
}
