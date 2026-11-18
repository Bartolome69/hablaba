// Typed access over the authored vocabulary packs. Content is versioned JSON in
// the repo (see lib/vocab/README.md): static, offline, and in the bundle. The
// packs never change at runtime; the learner's progress and own words do.

import adjetivos from "./content/adjetivos.json"
import animales from "./content/animales.json"
import bebe from "./content/bebe.json"
import bebidas from "./content/bebidas.json"
import calle from "./content/calle.json"
import casa from "./content/casa.json"
import colores from "./content/colores.json"
import comida from "./content/comida.json"
import cuerpo from "./content/cuerpo.json"
import emociones from "./content/emociones.json"
import juguetes from "./content/juguetes.json"
import muebles from "./content/muebles.json"
import ropa from "./content/ropa.json"
import verbos from "./content/verbos.json"
import type { CatalogWord, PackId, VocabSet, VocabSetId } from "./types"

/**
 * The Palabras shelf, in three short sections so every library is one tap
 * from the tab: the baby's world, the home and the street, and the words for
 * describing anything. `propias` ("Tus palabras") sits above all of these.
 * Drinks and furniture were groups inside La comida and La casa; they became
 * their own packs (Nov 2026) with their catalog ids unchanged, so progress
 * carried over (the catalog id, not the stored set, decides a word's pack).
 */
export const SHELF_SECTIONS: { title: string; packs: PackId[] }[] = [
  { title: "Del bebé", packs: ["bebe", "juguetes", "cuerpo", "emociones"] },
  { title: "Casa y calle", packs: ["comida", "bebidas", "ropa", "casa", "muebles", "calle", "animales"] },
  { title: "Para describir", packs: ["colores", "adjetivos", "verbos"] },
]

export const PACK_ORDER: PackId[] = SHELF_SECTIONS.flatMap((s) => s.packs)

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
      { id: "dulces", label: "Dulces" },
    ],
  },
  bebidas: {
    id: "bebidas",
    label: "Las bebidas",
    blurb: "From the morning milk to the café order",
    words: bebidas as CatalogWord[],
    groups: [
      { id: "todos", label: "Todos los días" },
      { id: "calientes", label: "Calientes" },
      { id: "cafe", label: "En el café" },
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
      { id: "cosas", label: "Las cosas" },
    ],
  },
  muebles: {
    id: "muebles",
    label: "Los muebles",
    blurb: "What's in every room, the cot included",
    words: muebles as CatalogWord[],
    groups: [
      { id: "living", label: "El living" },
      { id: "dormitorio", label: "El dormitorio" },
      { id: "cocina", label: "La cocina y el baño" },
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
  adjetivos: {
    id: "adjetivos",
    label: "Adjetivos comunes",
    blurb: "Big and small, full and empty: words in opposite pairs",
    words: adjetivos as CatalogWord[],
    groups: [
      { id: "tamano", label: "Tamaño y forma" },
      { id: "estado", label: "Cómo está" },
      { id: "como-es", label: "Cómo es" },
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

/** The label mid-sentence: "Empezar con la ropa", not "con La ropa". */
export function packLabelInline(id: VocabSetId): string {
  const label = packLabel(id)
  return label.charAt(0).toLowerCase() + label.slice(1)
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
