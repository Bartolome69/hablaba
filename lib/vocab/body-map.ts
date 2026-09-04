// Geometry for the tappable body diagram. Data, not JSX, so the shapes can be
// nudged without touching the component — and so the word list and the picture
// can never drift apart: every region names a `cuerpo.json` word id.
//
// Two figures rather than one. A face is mostly small parts (ojos, nariz,
// boca) and a body is mostly big ones; drawn at one scale the face regions
// come out as unhittable slivers, so the diagram has a Cuerpo / Cara segment
// and each figure gets the whole canvas.
//
// A few words have no region at all — `espalda` can't be shown on a
// front-facing figure, `dientes` and `lengua` sit inside the mouth. They are
// not lost: the surface lists every word in the set under the diagram, which
// is also what keeps this accessible. The picture is a way in, never the only
// way to reach a word.

/** A region is one or more shapes — limbs come in pairs and share a word. */
export type RegionShape =
  | { kind: "rect"; x: number; y: number; w: number; h: number; rx: number }
  | { kind: "ellipse"; cx: number; cy: number; rx: number; ry: number }
  | { kind: "path"; d: string }

export interface BodyRegion {
  /** The `cuerpo.json` word this region is. */
  wordId: string
  shapes: RegionShape[]
  /**
   * Darker unselected fill. Only `pelo`, which sits ON TOP of the head and so
   * disappears entirely when it shares the head's fill — the boundary between
   * them is the whole point of the region.
   */
  tone?: "shade"
  /** Where the leader label sits when the region is selected. */
  label: { x: number; y: number; anchor: "start" | "middle" | "end" }
}

export interface BodyFigure {
  id: "cuerpo" | "cara"
  label: string
  viewBox: string
  regions: BodyRegion[]
}

const BODY: BodyFigure = {
  id: "cuerpo",
  label: "Cuerpo",
  viewBox: "0 0 200 416",
  // Roughly seven heads tall, and the parts touch rather than float: at the
  // first pass the head was a third of the body and the shoulder band read as
  // a separate pill hovering over the chest.
  regions: [
    {
      wordId: "cuerpo-cabeza",
      shapes: [{ kind: "ellipse", cx: 100, cy: 38, rx: 25, ry: 29 }],
      label: { x: 132, y: 32, anchor: "start" },
    },
    {
      wordId: "cuerpo-pelo",
      shapes: [{ kind: "path", d: "M75,38 a25,29 0 0,1 50,0 q-25,11 -50,0 Z" }],
      tone: "shade",
      label: { x: 100, y: 12, anchor: "middle" },
    },
    {
      wordId: "cuerpo-cuello",
      shapes: [{ kind: "rect", x: 90, y: 63, w: 20, h: 16, rx: 7 }],
      label: { x: 124, y: 74, anchor: "start" },
    },
    {
      wordId: "cuerpo-hombro",
      shapes: [{ kind: "rect", x: 58, y: 77, w: 84, h: 23, rx: 11 }],
      label: { x: 52, y: 92, anchor: "end" },
    },
    {
      wordId: "cuerpo-pecho",
      shapes: [{ kind: "rect", x: 66, y: 100, w: 68, h: 48, rx: 13 }],
      label: { x: 148, y: 126, anchor: "start" },
    },
    {
      wordId: "cuerpo-panza",
      shapes: [{ kind: "rect", x: 68, y: 148, w: 64, h: 44, rx: 13 }],
      label: { x: 148, y: 172, anchor: "start" },
    },
    {
      wordId: "cuerpo-cola",
      shapes: [{ kind: "rect", x: 68, y: 192, w: 64, h: 30, rx: 13 }],
      label: { x: 148, y: 210, anchor: "start" },
    },
    {
      wordId: "cuerpo-brazo",
      shapes: [
        { kind: "rect", x: 40, y: 100, w: 19, h: 44, rx: 9 },
        { kind: "rect", x: 40, y: 166, w: 19, h: 36, rx: 9 },
        { kind: "rect", x: 141, y: 100, w: 19, h: 44, rx: 9 },
        { kind: "rect", x: 141, y: 166, w: 19, h: 36, rx: 9 },
      ],
      label: { x: 34, y: 122, anchor: "end" },
    },
    {
      wordId: "cuerpo-codo",
      shapes: [
        { kind: "rect", x: 39, y: 144, w: 21, h: 22, rx: 9 },
        { kind: "rect", x: 140, y: 144, w: 21, h: 22, rx: 9 },
      ],
      label: { x: 168, y: 160, anchor: "start" },
    },
    {
      wordId: "cuerpo-mano",
      shapes: [
        { kind: "rect", x: 36, y: 202, w: 27, h: 26, rx: 11 },
        { kind: "rect", x: 137, y: 202, w: 27, h: 26, rx: 11 },
      ],
      label: { x: 30, y: 218, anchor: "end" },
    },
    {
      wordId: "cuerpo-dedos",
      shapes: [
        { kind: "rect", x: 37, y: 228, w: 25, h: 22, rx: 10 },
        { kind: "rect", x: 138, y: 228, w: 25, h: 22, rx: 10 },
      ],
      label: { x: 172, y: 244, anchor: "start" },
    },
    {
      wordId: "cuerpo-pierna",
      shapes: [
        { kind: "rect", x: 70, y: 222, w: 28, h: 66, rx: 13 },
        { kind: "rect", x: 70, y: 312, w: 28, h: 58, rx: 13 },
        { kind: "rect", x: 102, y: 222, w: 28, h: 66, rx: 13 },
        { kind: "rect", x: 102, y: 312, w: 28, h: 58, rx: 13 },
      ],
      label: { x: 64, y: 262, anchor: "end" },
    },
    {
      wordId: "cuerpo-rodilla",
      shapes: [
        { kind: "rect", x: 69, y: 288, w: 30, h: 24, rx: 10 },
        { kind: "rect", x: 101, y: 288, w: 30, h: 24, rx: 10 },
      ],
      label: { x: 140, y: 304, anchor: "start" },
    },
    {
      wordId: "cuerpo-pie",
      shapes: [
        { kind: "rect", x: 62, y: 370, w: 36, h: 24, rx: 10 },
        { kind: "rect", x: 102, y: 370, w: 36, h: 24, rx: 10 },
      ],
      label: { x: 146, y: 386, anchor: "start" },
    },
  ],
}

const FACE: BodyFigure = {
  id: "cara",
  label: "Cara",
  viewBox: "0 0 200 220",
  regions: [
    {
      wordId: "cuerpo-cara",
      shapes: [{ kind: "ellipse", cx: 100, cy: 112, rx: 62, ry: 74 }],
      label: { x: 100, y: 208, anchor: "middle" },
    },
    {
      wordId: "cuerpo-pelo",
      shapes: [{ kind: "path", d: "M38,112 a62,74 0 0,1 124,0 q-62,26 -124,0 Z" }],
      tone: "shade",
      label: { x: 100, y: 22, anchor: "middle" },
    },
    {
      wordId: "cuerpo-orejas",
      shapes: [
        { kind: "ellipse", cx: 32, cy: 112, rx: 12, ry: 20 },
        { kind: "ellipse", cx: 168, cy: 112, rx: 12, ry: 20 },
      ],
      label: { x: 14, y: 96, anchor: "start" },
    },
    {
      wordId: "cuerpo-ojos",
      shapes: [
        { kind: "ellipse", cx: 74, cy: 98, rx: 16, ry: 11 },
        { kind: "ellipse", cx: 126, cy: 98, rx: 16, ry: 11 },
      ],
      label: { x: 100, y: 66, anchor: "middle" },
    },
    {
      wordId: "cuerpo-nariz",
      shapes: [{ kind: "ellipse", cx: 100, cy: 126, rx: 11, ry: 14 }],
      label: { x: 152, y: 130, anchor: "start" },
    },
    {
      wordId: "cuerpo-boca",
      shapes: [{ kind: "rect", x: 74, y: 154, w: 52, h: 22, rx: 11 }],
      label: { x: 152, y: 170, anchor: "start" },
    },
  ],
}

export const FIGURES: BodyFigure[] = [BODY, FACE]

/** Word ids the diagram can actually show — the rest are list-only. */
export const MAPPED_WORD_IDS = new Set(FIGURES.flatMap((f) => f.regions.map((r) => r.wordId)))
