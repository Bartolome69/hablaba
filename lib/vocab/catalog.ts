// Typed access over the authored vocabulary packs. Content is versioned JSON in
// the repo (see lib/vocab/README.md): static, offline, and in the bundle. The
// packs never change at runtime; the learner's progress and own words do.

import animales from "./content/animales.json"
import bebe from "./content/bebe.json"
import calle from "./content/calle.json"
import casa from "./content/casa.json"
import colores from "./content/colores.json"
import comida from "./content/comida.json"
import cuerpo from "./content/cuerpo.json"
import emociones from "./content/emociones.json"
import juguetes from "./content/juguetes.json"
import ropa from "./content/ropa.json"
import verbos from "./content/verbos.json"
import type { CatalogWord, PackId, VocabSet, VocabSetId } from "./types"

/**
 * Shelf order on the Palabras home: the baby's day first, then the world
 * around it, then the grammar-flavoured packs. `propias` sits above all of
 * these as "Tus palabras" and isn't listed here.
 */
export const PACK_ORDER: PackId[] = [
  "bebe",
  "comida",
  "cuerpo",
  "ropa",
  "casa",
  "juguetes",
  "animales",
  "calle",
  "colores",
  "emociones",
  "verbos",
]

export const SETS: Record<PackId, VocabSet> = {
  bebe: {
    id: "bebe",
    label: "Cosas del bebé",
    blurb: "Everything that comes in the nappy bag",
    words: bebe as CatalogWord[],
    groups: [
      { id: "cambiar", label: "Para cambiarlo" },
      { id: "comer", label: "Para comer" },
      { id: "dormir", label: "Para dormir" },
      { id: "salir", label: "Para salir" },
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
  ropa: {
    id: "ropa",
    label: "La ropa",
    blurb: "Getting dressed, every single morning",
    words: ropa as CatalogWord[],
    groups: [
      { id: "dia", label: "Todos los días" },
      { id: "frio", label: "Para el frío" },
      { id: "pies", label: "Los pies" },
    ],
  },
  casa: {
    id: "casa",
    label: "La casa",
    blurb: "The rooms and the things in them",
    words: casa as CatalogWord[],
    groups: [
      { id: "lugares", label: "Los lugares" },
      { id: "muebles", label: "Los muebles" },
      { id: "cosas", label: "Las cosas" },
    ],
  },
  juguetes: {
    id: "juguetes",
    label: "Juguetes y juego",
    blurb: "On the floor, at the plaza, with the crayons",
    words: juguetes as CatalogWord[],
    groups: [
      { id: "casa", label: "En casa" },
      { id: "plaza", label: "En la plaza" },
      { id: "crear", label: "Para crear" },
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
  calle: {
    id: "calle",
    label: "En la calle",
    blurb: "Everything you point at on the walk",
    words: calle as CatalogWord[],
    groups: [
      { id: "lugares", label: "Los lugares" },
      { id: "transporte", label: "Cómo nos movemos" },
      { id: "tiempo", label: "El tiempo" },
    ],
  },
  colores: {
    id: "colores",
    label: "Colores y formas",
    blurb: "The first questions every toddler gets asked",
    words: colores as CatalogWord[],
    groups: [
      { id: "colores", label: "Los colores" },
      { id: "formas", label: "Las formas" },
    ],
  },
  emociones: {
    id: "emociones",
    label: "Las emociones",
    blurb: "Naming the big feelings, theirs and yours",
    words: emociones as CatalogWord[],
    groups: [
      { id: "como", label: "¿Cómo estás?" },
      { id: "sentimientos", label: "Lo que sentimos" },
    ],
  },
  verbos: {
    id: "verbos",
    label: "Verbos de todos los días",
    blurb: "The doing words, plus the five worth working into conversation",
    words: verbos as CatalogWord[],
    groups: [
      { id: "clave", label: "Verbos clave" },
      { id: "dia", label: "Todo el día" },
    ],
  },
}

export const PROPIAS_LABEL = "Tus palabras"

export function packLabel(id: VocabSetId): string {
  return id === "propias" ? PROPIAS_LABEL : SETS[id].label
}

export function isPackId(id: string): id is PackId {
  return id in SETS
}

/** Every authored word, flat — used for the word of the day and id lookup. */
export const allCatalogWords: CatalogWord[] = PACK_ORDER.flatMap((id) => SETS[id].words)

const byId = new Map(allCatalogWords.map((w) => [w.id, w]))
const packById = new Map(
  PACK_ORDER.flatMap((pack) => SETS[pack].words.map((w) => [w.id, pack] as const)),
)

export function getCatalogWord(id: string): CatalogWord | undefined {
  return byId.get(id)
}

/** The pack a catalog word belongs to. */
export function packOfCatalogWord(id: string): PackId | undefined {
  return packById.get(id)
}

/** Rotates once a day, same for the whole day — mirrors the phrase of the day. */
export function wordOfTheDay(now = new Date()): CatalogWord {
  const start = new Date(now.getFullYear(), 0, 0)
  const day = Math.floor((now.getTime() - start.getTime()) / 86_400_000)
  return allCatalogWords[day % allCatalogWords.length]
}
