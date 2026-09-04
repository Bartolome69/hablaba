// The Clay + calm duotone icon set (Aug 2026 handoff). Every icon is inline
// SVG on a 24×24 grid: the body draws in `currentColor` (set ink, green or
// cream from the parent), plus ONE terracotta detail. No emoji, no icon
// library on the redesigned screens.
//
// Icons ported from the handoff's design canvas; the ones the canvas didn't
// need (grammar topics, extra charla starters) are drawn in the same language.

import type { CSSProperties, ReactNode } from "react"

const T = "#C4633E" // terracotta — the one detail color
const CREAM = "#F7F3EC"

type IconProps = {
  size?: number
  className?: string
  /** Overrides the terracotta detail — e.g. #8FBE9C for the mic on green. */
  detail?: string
  style?: CSSProperties
}

type Drawer = (d: string) => ReactNode

const draw: Record<string, Drawer> = {
  // ── navigation ────────────────────────────────────────────────────────────
  hoy: (d) => (
    <>
      <circle cx="12" cy="12" r="4.2" fill="currentColor" />
      <path
        d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6"
        stroke={d}
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </>
  ),
  charlar: (d) => (
    <>
      <path
        d="M3.6 8.4A3.4 3.4 0 0 1 7 5h7.6a3.4 3.4 0 0 1 3.4 3.4v3.2a3.4 3.4 0 0 1-3.4 3.4H9.4L5.6 18v-3.2a3.4 3.4 0 0 1-2-3.2Z"
        fill="currentColor"
      />
      <circle cx="20" cy="6.4" r="2.4" fill={d} />
    </>
  ),
  libro: (d) => (
    <>
      <path d="M12 6.6C10 4.9 7.4 4.4 4.4 4.6v12.6c3-.2 5.6.3 7.6 2Z" fill="currentColor" />
      <path
        d="M12 6.6c2-1.7 4.6-2.2 7.6-2v12.6c-3-.2-5.6.3-7.6 2Z"
        stroke={d}
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
    </>
  ),
  practica: (d) => (
    <>
      <rect x="2.6" y="9.4" width="4" height="5.2" rx="1.6" fill="currentColor" />
      <rect x="17.4" y="9.4" width="4" height="5.2" rx="1.6" fill="currentColor" />
      <rect x="6.6" y="10.8" width="10.8" height="2.4" rx="1.2" fill={d} />
    </>
  ),

  // ── the core set from the canvas logic class ─────────────────────────────
  casa: (d) => (
    <>
      <path
        d="M4 11.6 12 5l8 6.6V19a1.6 1.6 0 0 1-1.6 1.6h-3.2v-5.2h-6.4v5.2H5.6A1.6 1.6 0 0 1 4 19Z"
        fill="currentColor"
      />
      <circle cx="12" cy="11.6" r="1.7" fill={d} />
    </>
  ),
  frases: (d) => (
    <>
      <rect x="3.5" y="4" width="7.6" height="16" rx="2.6" fill="currentColor" />
      <rect x="12.9" y="4" width="7.6" height="16" rx="2.6" fill={d} />
      <rect x="5.6" y="7" width="3.4" height="1.7" rx="0.85" fill={CREAM} />
    </>
  ),
  racha: (d) => (
    <>
      <path
        d="M12 2.6c3.2 2.4 5 5.1 5 7.9a5 5 0 0 1-10 0c0-1.1.4-2.1 1-3 .1 1.3.9 2.2 1.9 2.2 1.1 0 1.7-.9 1.5-2.4-.2-1.5-.3-3 .6-4.7Z"
        fill={d}
      />
      <path
        d="M12 21.6a5 5 0 0 1-5-5c0-.5.1-1 .2-1.4 1 1.6 2.7 2.6 4.8 2.6s3.8-1 4.8-2.6c.1.4.2.9.2 1.4a5 5 0 0 1-5 5Z"
        fill="currentColor"
      />
    </>
  ),
  micro: (d) => (
    <>
      <rect x="8.6" y="2.6" width="6.8" height="12" rx="3.4" fill="currentColor" />
      <path
        d="M5.4 11.6a6.6 6.6 0 0 0 13.2 0"
        stroke={d}
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <rect x="10.9" y="17.6" width="2.2" height="3.8" rx="1.1" fill="currentColor" />
    </>
  ),
  escuchar: (d) => (
    <>
      <path
        d="M4 9.6c0-.9.7-1.6 1.6-1.6h2.2l3.4-3a1.2 1.2 0 0 1 2 .9v12.2a1.2 1.2 0 0 1-2 .9l-3.4-3H5.6A1.6 1.6 0 0 1 4 14.4Z"
        fill="currentColor"
      />
      <path d="M16.2 8.6a4.6 4.6 0 0 1 0 6.8" stroke={d} strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
  pausa: (d) => (
    <>
      <rect x="6" y="5" width="4.6" height="14" rx="2.3" fill="currentColor" />
      <rect x="13.4" y="5" width="4.6" height="14" rx="2.3" fill={d} />
    </>
  ),
  reproducir: () => (
    <>
      <circle cx="12" cy="12" r="9" fill="currentColor" />
      <path
        d="M10.3 8.6 14.6 12l-4.3 3.4Z"
        fill={CREAM}
        stroke={CREAM}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </>
  ),
  parar: (d) => <rect x="5" y="5" width="14" height="14" rx="4.6" fill={d} />,
  repasar: (d) => (
    <>
      <path
        d="M12 5.5a6.5 6.5 0 1 1-6.2 4.6"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M5.4 4.6v3.9h3.9"
        stroke={d}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
  nueva: (d) => (
    <path
      d="m12 3.4 2.5 5.4 5.9.7-4.4 4 1.2 5.8L12 16.4 6.8 19.3 8 13.5l-4.4-4 5.9-.7Z"
      fill={d}
    />
  ),
  guardada: () => (
    <path
      d="M6.6 4h10.8a1.6 1.6 0 0 1 1.6 1.6v14.1a.8.8 0 0 1-1.25.66L12 16.6l-5.75 3.76A.8.8 0 0 1 5 19.7V5.6A1.6 1.6 0 0 1 6.6 4Z"
      fill="currentColor"
    />
  ),
  buscar: (d) => (
    <>
      <circle cx="10.6" cy="10.6" r="6.4" stroke="currentColor" strokeWidth="2.4" fill="none" />
      <path d="m15.6 15.6 4 4" stroke={d} strokeWidth="2.6" strokeLinecap="round" />
    </>
  ),
  onda: (d) => (
    <>
      <rect x="3" y="10" width="2.6" height="4" rx="1.3" fill="currentColor" />
      <rect x="7" y="7" width="2.6" height="10" rx="1.3" fill="currentColor" />
      <rect x="11" y="4.5" width="2.6" height="15" rx="1.3" fill={d} />
      <rect x="15" y="8" width="2.6" height="8" rx="1.3" fill="currentColor" />
      <rect x="19" y="10.5" width="2.6" height="3" rx="1.3" fill="currentColor" />
    </>
  ),
  logrado: () => (
    <>
      <circle cx="12" cy="12" r="9" fill="currentColor" />
      <path
        d="m8.2 12.2 2.6 2.6 5-5.2"
        stroke={CREAM}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
  tiempo: (d) => (
    <>
      <circle cx="12" cy="12" r="8.6" fill="currentColor" />
      <path d="M12 7.4V12l3 1.8" stroke={d} strokeWidth="2.2" strokeLinecap="round" fill="none" />
    </>
  ),
  peque: () => (
    <>
      <circle cx="12" cy="8" r="4.2" fill="currentColor" />
      <path d="M5 20.6a7 7 0 0 1 14 0 1 1 0 0 1-1 1H6a1 1 0 0 1-1-1Z" fill="currentColor" />
      <circle cx="9.6" cy="8" r="1.1" fill={CREAM} />
      <circle cx="14.4" cy="8" r="1.1" fill={CREAM} />
    </>
  ),
  familia: (d) => (
    <>
      <circle cx="12" cy="9" r="4" fill="currentColor" />
      <path d="M5.4 20.6a6.6 6.6 0 0 1 13.2 0Z" fill="currentColor" />
      <circle cx="7.4" cy="7" r="2.2" fill={d} />
      <circle cx="16.6" cy="7" r="2.2" fill={d} />
    </>
  ),
  ajustes: (d) => (
    <>
      <circle cx="12" cy="12" r="3.2" fill={d} />
      <path
        d="M10.6 2.8h2.8l.4 2.1 1.9.8 1.8-1.2 2 2-1.2 1.8.8 1.9 2.1.4v2.8l-2.1.4-.8 1.9 1.2 1.8-2 2-1.8-1.2-1.9.8-.4 2.1h-2.8l-.4-2.1-1.9-.8-1.8 1.2-2-2 1.2-1.8-.8-1.9-2.1-.4v-2.8l2.1-.4.8-1.9L4.5 6.5l2-2 1.8 1.2 1.9-.8Zm1.4 5.6a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2Z"
        fill="currentColor"
        opacity=".82"
      />
    </>
  ),
  calendario: (d) => (
    <>
      <rect x="3.6" y="5.4" width="16.8" height="15" rx="3" fill="currentColor" opacity=".14" />
      <path d="M3.6 9.4h16.8" stroke="currentColor" strokeWidth="1.6" />
      <rect x="7" y="12.4" width="3.4" height="3.4" rx="1" fill={d} />
      <path d="M7.6 3.6v3M16.4 3.6v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  rayo: (d) => <path d="M13.6 2.6 5.4 13.4h4.8l-.6 8 8.2-10.8h-4.8Z" fill={d} />,
  brote: (d) => (
    <>
      <path d="M12 21v-7.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 13.6C8.8 13.6 6.4 11.4 6.4 8.2c3.2 0 5.6 2.2 5.6 5.4Z" fill="currentColor" />
      <path d="M12 13.6c0-3.2 2.4-5.4 5.6-5.4 0 3.2-2.4 5.4-5.6 5.4Z" fill={d} />
    </>
  ),
  pista: (d) => (
    <>
      <circle cx="12" cy="12" r="9" fill={d} opacity=".2" />
      <path d="M12 7.6v.6M12 11v5.4" stroke={d} strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
  quiz: (d) => (
    <>
      <path d="m9.4 3.4 1.7 3.9 3.9 1.7-3.9 1.7-1.7 3.9-1.7-3.9L3.8 9l3.9-1.7Z" fill="currentColor" />
      <path d="m17.2 13.2 1.1 2.5 2.5 1.1-2.5 1.1-1.1 2.5-1.1-2.5-2.5-1.1 2.5-1.1Z" fill={d} />
    </>
  ),
  overflow: (d) => (
    <>
      <path
        d="M4.4 6.6h15.2M4.4 12h15.2M4.4 17.4h9"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <circle cx="18" cy="17.4" r="2.2" fill={d} />
    </>
  ),
  lento: () => (
    <path
      d="M4.6 6.4h14.8M4.6 12h14.8M4.6 17.6h9.4"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  ),
  check: () => (
    <path
      d="m6.4 12.4 3.6 3.6 7.6-8"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  volver: () => (
    <path
      d="M19 12H5.6M11 5.6 4.6 12l6.4 6.4"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  chevron: () => (
    <path
      d="m9.5 6 6 6-6 6"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  flecha: (d) => (
    <path
      d="M4.5 12h14M13 6.5 18.5 12 13 17.5"
      stroke={d}
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  mesa: (d) => (
    <>
      <circle cx="12" cy="12" r="6.4" fill="currentColor" />
      <circle cx="12" cy="12" r="2.6" fill={CREAM} />
      <path
        d="M4 4.4v5.2M19.4 4.4v3.2a1.6 1.6 0 0 1-3.2 0V4.4"
        stroke={d}
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
    </>
  ),

  // ── moments ───────────────────────────────────────────────────────────────
  despertar: (d) => (
    <>
      <circle cx="12" cy="13.4" r="4" fill={d} />
      <path
        d="M12 5.4v2M4.6 13.4h2M17.4 13.4h2M6.8 8.2 8.2 9.6M17.2 8.2 15.8 9.6"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <path d="M3.6 19.4h16.8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </>
  ),
  comida: (d) => (
    <>
      <path
        d="M7 3.6v7.8M4.6 3.6v3.4a2.4 2.4 0 0 0 4.8 0V3.6M7 11.4v9"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M15.4 3.6c2.6 0 4 2.4 4 5.4s-1.4 4.4-4 4.4-4-1.4-4-4.4 1.4-5.4 4-5.4Z" fill={d} />
    </>
  ),
  paseo: (d) => (
    <>
      <rect x="3" y="5.4" width="18" height="13.2" rx="3.2" fill="currentColor" />
      <path d="M6 15.6l3.4-4 2.8 3.2 2.4-2.6 3.4 3.4Z" fill={CREAM} opacity=".9" />
      <circle cx="8.4" cy="9.4" r="1.7" fill={d} />
    </>
  ),
  bano: (d) => (
    <>
      <path
        d="M3.4 11.6h17.2v2.6a4.4 4.4 0 0 1-4.4 4.4H7.8a4.4 4.4 0 0 1-4.4-4.4Z"
        fill="currentColor"
      />
      <path
        d="M7 11.6V6.4a2.4 2.4 0 0 1 4.8 0"
        stroke={d}
        strokeWidth="1.9"
        strokeLinecap="round"
        fill="none"
      />
    </>
  ),
  calmar: (d) => (
    <>
      <path
        d="M12 20.2 5.2 13.4a4.6 4.6 0 0 1 6.5-6.5l.3.3.3-.3a4.6 4.6 0 0 1 6.5 6.5Z"
        fill="currentColor"
      />
      <circle cx="15.8" cy="8.2" r="1.6" fill={d} />
    </>
  ),
  dormir: (d) => (
    <>
      <path
        d="M19.6 14.2A8 8 0 0 1 9.8 4.4a8 8 0 1 0 9.8 9.8Z"
        fill="currentColor"
      />
      <path d="M15 4.6h4l-4 4.4h4" stroke={d} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),

  // ── charla starters ───────────────────────────────────────────────────────
  taza: (d) => (
    <>
      <path
        d="M4 8.6h11.6v6.2a4.6 4.6 0 0 1-4.6 4.6H8.6A4.6 4.6 0 0 1 4 14.8Z"
        fill="currentColor"
      />
      <path
        d="M15.6 10h1.6a2.6 2.6 0 0 1 0 5.2h-1.6"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="none"
      />
      <path d="M7.6 3.4v2.4M11.6 3.4v2.4" stroke={d} strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  carrito: (d) => (
    <>
      <path
        d="M3.4 4.6h2.2l2 10.2a1.6 1.6 0 0 0 1.6 1.3h8a1.6 1.6 0 0 0 1.6-1.2l1.6-6.9H6.4"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="9.8" cy="20" r="1.7" fill={d} />
      <circle cx="16.6" cy="20" r="1.7" fill={d} />
    </>
  ),
  recuerdos: (d) => (
    <>
      <rect x="3.4" y="6.4" width="17.2" height="13" rx="3" fill="currentColor" />
      <path d="M9 6.4 10.4 4h3.2L15 6.4" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="none" />
      <circle cx="12" cy="12.8" r="3.4" fill={CREAM} opacity=".9" />
      <circle cx="12" cy="12.8" r="1.5" fill={d} />
    </>
  ),
  pensamiento: (d) => (
    <>
      <path
        d="M3.6 8A4 4 0 0 1 7.6 4h6.8a4 4 0 0 1 4 4v2.4a4 4 0 0 1-4 4H10l-4 3v-3.2A4 4 0 0 1 3.6 10.8Z"
        fill="currentColor"
      />
      <circle cx="20" cy="17.4" r="2.4" fill={d} />
    </>
  ),
  dado: (d) => (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4.4" fill="currentColor" />
      <circle cx="9" cy="9" r="1.5" fill={CREAM} />
      <circle cx="15" cy="15" r="1.5" fill={CREAM} />
      <circle cx="15" cy="9" r="1.5" fill={d} />
      <circle cx="9" cy="15" r="1.5" fill={CREAM} />
    </>
  ),
  mascara: (d) => (
    <>
      <path
        d="M4.4 5.2c2.4.9 5 .9 7.6 0v7.2a3.8 3.8 0 1 1-7.6 0Z"
        fill="currentColor"
      />
      <path
        d="M12 8.4c2.4.9 5.2.9 7.6 0v7.2a3.8 3.8 0 1 1-7.6 0Z"
        fill={d}
      />
    </>
  ),
  avion: (d) => (
    <>
      <path
        d="m20.6 3.4-5.2 17-3-7.2-7.2-3Z"
        fill="currentColor"
      />
      <path d="m12.4 13.2 4.4-4.4" stroke={d} strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  maletin: (d) => (
    <>
      <rect x="3.4" y="7.4" width="17.2" height="12" rx="3" fill="currentColor" />
      <path
        d="M9 7.4V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.4"
        stroke="currentColor"
        strokeWidth="1.9"
        fill="none"
      />
      <rect x="10.4" y="11.6" width="3.2" height="2.6" rx="1" fill={d} />
    </>
  ),
  pelicula: (d) => (
    <>
      <rect x="3.4" y="5" width="17.2" height="14" rx="3" fill="currentColor" />
      <path
        d="M3.4 9h17.2"
        stroke={CREAM}
        strokeWidth="1.4"
        opacity=".6"
      />
      <path d="M10.6 12 14 14.1l-3.4 2.1Z" fill={d} />
    </>
  ),
  pelota: (d) => (
    <>
      <circle cx="12" cy="12" r="8.6" fill="currentColor" />
      <path
        d="M12 3.4v17.2M3.4 12h17.2"
        stroke={CREAM}
        strokeWidth="1.4"
        opacity=".55"
      />
      <circle cx="12" cy="12" r="2.6" fill={d} />
    </>
  ),
  fiesta: (d) => (
    <>
      <path d="m5 20 3.2-9.4L14.4 16Z" fill="currentColor" />
      <path
        d="M13.6 10.2c1.8-1.8 4-2.2 6-1.2M12 7.8c.2-1.8 1.2-3 2.8-3.6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="17.8" cy="4.8" r="1.6" fill={d} />
    </>
  ),

  // ── grammar topics ────────────────────────────────────────────────────────
  intercambio: () => (
    <path
      d="M4 12h16M8 8l-4 4 4 4M16 8l4 4-4 4"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  relojAtras: () => (
    <>
      <circle cx="12" cy="12" r="8.6" fill="currentColor" />
      <path
        d="M12 7.6V12l-3 2"
        stroke="#E4EDE5"
        strokeWidth="2.1"
        strokeLinecap="round"
        fill="none"
      />
    </>
  ),
  // Stroke-based clock (reads on green AND cream chips, unlike the filled
  // relojAtras) with the terracotta "just happened" dot.
  reciente: (d) => (
    <>
      <circle cx="12" cy="12.6" r="7.8" stroke="currentColor" strokeWidth="2" fill="none" />
      <path
        d="M12 8.8v3.8l2.6 1.7"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="19" cy="4.6" r="2" fill={d} />
    </>
  ),
  ola: () => (
    <path
      d="M3.6 14.4c2-4 4.4-4 6.4 0s4.4 4 6.4 0 3.4-2.6 4 0"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
  ),
  rebobinar: (d) => (
    <>
      <path d="M11 6 5 12l6 6Z" fill="currentColor" />
      <path d="M19 6l-6 6 6 6Z" fill={d} />
    </>
  ),
  checkCuadro: () => (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4.4" fill="currentColor" />
      <path
        d="m8.4 12.4 2.8 2.8 5.2-5.6"
        stroke="#E4EDE5"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
  bola: (d) => (
    <>
      <circle cx="12" cy="10.4" r="6.4" fill="currentColor" />
      <rect x="8" y="17.4" width="8" height="3" rx="1.5" fill={d} />
    </>
  ),
  luna: (d) => (
    <>
      <path d="M19.6 14.2A8 8 0 0 1 9.8 4.4a8 8 0 1 0 9.8 9.8Z" fill="currentColor" />
      <circle cx="16.8" cy="6.8" r="1.6" fill={d} />
    </>
  ),
  campana: (d) => (
    <>
      <path
        d="M12 3.4a5.6 5.6 0 0 1 5.6 5.6c0 3.4.9 5 1.8 6H4.6c.9-1 1.8-2.6 1.8-6A5.6 5.6 0 0 1 12 3.4Z"
        fill="currentColor"
      />
      <path d="M9.8 18.4a2.3 2.3 0 0 0 4.4 0" stroke={d} strokeWidth="2" strokeLinecap="round" fill="none" />
    </>
  ),
  megafono: (d) => (
    <>
      <path d="m4 10 12-5.4v14.8L4 14Z" fill="currentColor" />
      <path d="M18.4 9.2a4 4 0 0 1 0 5.6" stroke={d} strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M7 14.6v4.6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  llave: (d) => (
    <>
      <circle cx="8.4" cy="8.4" r="5" fill="currentColor" />
      <circle cx="8.4" cy="8.4" r="1.8" fill={CREAM} />
      <path
        d="m12 12 7.6 7.6M16.6 16.6l2.4-2.4M19 19l2-2"
        stroke={d}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </>
  ),
  corazon: (d) => (
    <>
      <path
        d="M12 20.2 5.2 13.4a4.6 4.6 0 0 1 6.5-6.5l.3.3.3-.3a4.6 4.6 0 0 1 6.5 6.5Z"
        fill={d}
      />
      <path d="m7.4 12.2 2-2 2.2 2.2 2-2" stroke={CREAM} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),
  diana: (d) => (
    <>
      <circle cx="12" cy="12" r="8.6" fill="currentColor" />
      <circle cx="12" cy="12" r="5" fill={CREAM} />
      <circle cx="12" cy="12" r="2" fill={d} />
    </>
  ),
  sobre: (d) => (
    <>
      <rect x="3.4" y="5.8" width="17.2" height="12.4" rx="2.8" fill="currentColor" />
      <path
        d="m4.6 7.4 7.4 5.6 7.4-5.6"
        stroke={CREAM}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="19" cy="6.6" r="2.2" fill={d} />
    </>
  ),
  eslabon: (d) => (
    <>
      <path
        d="M10 14 14 10"
        stroke={d}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M8.6 12.2 6.4 14.4a3.4 3.4 0 0 0 4.8 4.8l2.2-2.2M15.4 11.8l2.2-2.2a3.4 3.4 0 0 0-4.8-4.8l-2.2 2.2"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
    </>
  ),
  balanza: (d) => (
    <>
      <path d="M12 4.4v13M5.4 7h13.2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M3.2 13.6a2.8 2.8 0 0 0 5.6 0L6 7.6Z" fill="currentColor" />
      <path d="M15.2 13.6a2.8 2.8 0 0 0 5.6 0L18 7.6Z" fill={d} />
      <path d="M8.6 19.6h6.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  trofeo: (d) => (
    <>
      <path
        d="M7.4 4h9.2v5.2a4.6 4.6 0 0 1-9.2 0Z"
        fill="currentColor"
      />
      <path
        d="M7.4 5.6H4.6a3 3 0 0 0 3 3M16.6 5.6h2.8a3 3 0 0 1-3 3"
        stroke="currentColor"
        strokeWidth="1.7"
        fill="none"
      />
      <path d="M10.4 15.4h3.2v2.2h-3.2z" fill="currentColor" />
      <rect x="8" y="17.6" width="8" height="2.8" rx="1.2" fill={d} />
    </>
  ),
  // ── vocabulary ────────────────────────────────────────────────────────────
  palabras: (d) => (
    <>
      <rect x="3" y="4.6" width="18" height="14.8" rx="3.4" stroke="currentColor" strokeWidth="1.9" fill="none" />
      <path d="M7.2 15.4 10.4 8.6l3.2 6.8M8.3 13.2h4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16.9" cy="14.4" r="1.7" fill={d} />
    </>
  ),
  cuerpo: (d) => (
    <>
      <circle cx="12" cy="5.1" r="2.5" fill="currentColor" />
      <path d="M12 8.4v6.2M12 14.6 9 21M12 14.6 15 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.4 10.6 12 11.9l5.6-1.3" stroke={d} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  animal: (d) => (
    <>
      <path d="M5.4 12.9c0-3.2 2.9-5.6 6.6-5.6s6.6 2.4 6.6 5.6c0 3.6-3 5.9-6.6 5.9s-6.6-2.3-6.6-5.9Z" fill="currentColor" />
      <path d="M6.6 7.7 5.1 4.1l3.5 1.7M17.4 7.7l1.5-3.6-3.5 1.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="9.5" cy="12.4" r="1.1" fill={CREAM} />
      <circle cx="14.5" cy="12.4" r="1.1" fill={CREAM} />
      <circle cx="12" cy="15.3" r="1.4" fill={d} />
    </>
  ),
  manzana: (d) => (
    <>
      <path d="M12 8.3c-1-.8-2.1-1.2-3.2-1.2C6.4 7.1 4.8 9.2 4.8 12c0 3.9 2.8 8 5.1 8 .7 0 1.4-.4 2.1-.4s1.4.4 2.1.4c2.3 0 5.1-4.1 5.1-8 0-2.8-1.6-4.9-4-4.9-1.1 0-2.2.4-3.2 1.2Z" fill="currentColor" />
      <path d="M12 7.6V4.4" stroke={d} strokeWidth="1.9" strokeLinecap="round" />
      <path d="M12.3 5.4c1-1.6 2.6-2.1 4-1.9.2 1.6-.8 3-2.4 3.4" fill={d} />
    </>
  ),

}

export type IconName = keyof typeof draw

export function DuoIcon({ name, size = 24, className, detail = T, style }: IconProps & { name: IconName }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      style={style}
      aria-hidden
    >
      {draw[name](detail)}
    </svg>
  )
}

// ── semantic mappings ────────────────────────────────────────────────────────

/** Conversation starters (voice topics + migrated Practice subjects). */
const TOPIC_ICONS: Record<string, IconName> = {
  // voice topics
  dia: "peque",
  charla: "pensamiento",
  mandados: "carrito",
  recuerdos: "recuerdos",
  opiniones: "pensamiento",
  sorpresa: "dado",
  "rol-cafe": "taza",
  "rol-verduleria": "carrito",
  "parent-child": "familia",
  // interests
  restaurant: "mesa",
  travel: "avion",
  family: "familia",
  work: "maletin",
  weekend: "fiesta",
  movies: "pelicula",
  food: "comida",
  sports: "pelota",
  // daily life
  morning: "despertar",
  dinner: "comida",
  shopping: "carrito",
  endofday: "luna",
  house: "casa",
  coffee: "taza",
}

export function topicIcon(id: string | undefined): IconName {
  return (id && TOPIC_ICONS[id]) || "charlar"
}

/** Phrase moments (the Frases filter chips). */
const MOMENT_ICONS: Record<string, IconName> = {
  despertar: "despertar",
  comida: "comida",
  juego: "peque",
  paseo: "paseo",
  baño: "bano",
  calmar: "calmar",
  dormir: "dormir",
}

export function momentIcon(id: string): IconName {
  return MOMENT_ICONS[id] ?? "brote"
}

/** Exercises taxonomy topics. */
const GRAMMAR_ICONS: Record<string, IconName> = {
  "ser-vs-estar": "mascara",
  "por-vs-para": "intercambio",
  "preterite-vs-imperfect": "balanza",
  preterite: "relojAtras",
  imperfect: "ola",
  pluperfect: "rebobinar",
  "present-perfect": "checkCuadro",
  "future-tense": "bola",
  conditional: "pensamiento",
  "present-subjunctive": "luna",
  "subjunctive-triggers": "campana",
  commands: "megafono",
  "haber-uses": "llave",
  "gustar-verbs": "corazon",
  "reflexive-verbs": "repasar",
  "direct-object-pronouns": "diana",
  "indirect-object-pronouns": "sobre",
  "object-pronouns": "eslabon",
  comparatives: "balanza",
  superlatives: "trofeo",
  "bien-vs-buen": "logrado",
  "muy-vs-mucho": "onda",
  "si-clauses": "intercambio",
  "imperfect-subjunctive": "luna",
}

export function grammarIcon(id: string): IconName {
  return GRAMMAR_ICONS[id] ?? "libro"
}

/** Vocabulary sets (the Palabras chip row). */
const VOCAB_SET_ICONS: Record<string, IconName> = {
  cuerpo: "cuerpo",
  animales: "animal",
  comida: "manzana",
  propias: "brote",
}

export function vocabSetIcon(id: string): IconName {
  return VOCAB_SET_ICONS[id] ?? "palabras"
}
