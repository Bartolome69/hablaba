---
name: Hablaba
description: Clay + calm — editorial restraint with tactile press physics, for calm daily Spanish practice
colors:
  bg: "#F8F3EB"
  surface: "#FDFBF6"
  surface-sunken: "#F1EADC"
  surface-sunken-2: "#EFE7DA"
  rule: "#E8E1D3"
  card-lip: "#EDE5D6"
  ink: "#1E3D2C"
  ink-muted: "#6E7A6F"
  ink-soft: "#8A9188"
  ink-faint: "#9AA097"
  green: "#1B5A2E"
  green-press: "#123C1F"
  green-tint: "#E4EDE5"
  green-on-dark: "#9FC7AB"
  cream-on-dark: "#F7F3EC"
  terracotta: "#C4633E"
  terracotta-tint: "#F4DFCC"
  terracotta-ink: "#8A4527"
typography:
  display:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "34px"
    fontWeight: 400
    lineHeight: 1.0
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "19px"
    fontWeight: 400
    lineHeight: 1.3
  phrase:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "17.5px"
    fontWeight: 400
    lineHeight: 1.4
  body:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "13.5px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.4
  smallcaps:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "10.5px"
    fontWeight: 500
    letterSpacing: "0.16em"
    textTransform: uppercase
rounded:
  card: "20px"
  row: "18px"
  hero: "26px"
  well: "12px"
  full: "9999px"
spacing:
  gutter: "22px"
  section: "26px"
  withinGroup: "8px"
components:
  clay-card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    boxShadow: "inset 0 0 0 1px rgba(30,61,44,.07), 0 2px 0 {colors.card-lip}"
    pressed: "translateY(2px), lip collapses to 0"
  green-button:
    backgroundColor: "{colors.green}"
    textColor: "{colors.cream-on-dark}"
    rounded: "{rounded.full}"
    boxShadow: "0 4px 0 {colors.green-press}"
    pressed: "translateY(4px), lip collapses to 0"
  recessed-input:
    backgroundColor: "{colors.surface-sunken}"
    rounded: "{rounded.full}"
    boxShadow: "inset 0 2px 4px rgba(30,61,44,.08)"
  chip:
    backgroundColor: "{colors.surface-sunken}"
    rounded: "{rounded.full}"
    height: "34-38px"
    pressed: "scale(.96)"
  chat-bubble-user:
    backgroundColor: "{colors.green}"
    textColor: "{colors.cream-on-dark}"
    rounded: "20px 20px 7px 20px"
    boxShadow: "0 3px 0 {colors.green-press}"
  chat-bubble-bot:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "20px 20px 20px 7px"
    boxShadow: "inset 0 0 0 1px rgba(30,61,44,.07), 0 2px 0 {colors.card-lip}"
---

# Design System: Hablaba — "Clay + calm"

The visual system from the August 2026 handoff (`Hablaba — Clay + calm`,
Concepto 5). It replaced the earlier "Morning Kitchen" system wholesale:
DM Sans/Fraunces became Outfit/Newsreader, the OKLch earth palette became the
fixed cream/forest/terracotta hex palette above, and the flat "nothing floats"
elevation rule became press physics — surfaces are raised clay pads whose hard
bottom lip collapses under the finger.

## 1. Overview

**Clay + calm** = the restrained grid, hairline rules and generous spacing of
an editorial layout, combined with a gently tactile press physics (a hard
2–5px bottom shadow that collapses on press). Emoji are banned everywhere and
replaced by a bespoke duotone icon set (`components/icons.tsx`): green body,
one terracotta detail, 24×24 grid.

Key characteristics:

- **One green block per screen.** The deep `green` (#1B5A2E) hero — resume
  card, phrase of the day, quiz-me row, Con tu peque — is the screen's single
  saturated mass. Everything else is cream.
- **One terracotta accent per screen.** Terracotta is a spot colour for the
  state that matters (a correction, a new phrase, the streak, the active
  moment chip) — never decoration. Never red, never an error icon; a wrong
  answer gets `terracotta-tint` and a "Mejor: «…»" recast.
- **Serif carries the Spanish.** Newsreader for screen titles, section heads,
  phrases and every conversational sentence. Outfit for UI: row titles,
  metadata, chips, nav labels, small-caps labels.
- Hairline `rule` dividers, 22px gutters, screens end above the 86px nav.

## 2. Press physics (the "clay" part)

Every pressable surface depresses; nothing bounces.

- Raised card / row: `translateY(2px)`, the 2px lip drops to 0.
- Green button / hero: `translateY(4px)`, 4px lip to 0. Large heroes add a
  soft green throw (`0 22px 34px -26px rgba(18,60,31,.85)`).
- Circular icon buttons: `scale(.92–.96)`. Chips: `scale(.96)`.
- 120ms, `cubic-bezier(.22,1,.36,1)`. No bounce, no spring.

Implemented as CSS utilities in `app/globals.css`: `clay-card`, `clay-static`,
`clay-green`, `clay-green-hero`, `clay-green-disc`, `clay-cream`, `clay-well`,
`clay-recessed`, `press-disc`, `press-chip`, plus `smallcaps`, `fade-top`,
`anim-bar`, `anim-breathe`, `anim-settle`, `stagger-children`.

## 3. Motion

From the choreography board (Concept 2 of the handoff, still the spec):

- List/pack entrance: 520ms, `cubic-bezier(.22,1,.36,1)`, children staggered
  60ms (`stagger-children`).
- Phrase/translation settle: 300ms, `translateY(12px) → 0`, no bounce
  (`anim-settle`); the translation fold trails the phrase.
- Thinking indicator: three 3px bars (green, green, terracotta) animating
  `scaleY(.35 → 1)`, 1.1s, staggered 140ms (`anim-bar`).
- The mic disc's breathing ring: `scale(1 → 1.14)`, opacity .55 → .18, 4.4s
  ease-in-out infinite (`anim-breathe`).
- `prefers-reduced-motion` collapses all of it.

## 4. Icons

All icons are inline SVG on a 24×24 grid, duotone: body in `currentColor`
(ink, green, or cream depending on the surface), ONE terracotta detail
(overridable via the `detail` prop — e.g. `#8FBE9C` for the mic on green).
The set lives in `components/icons.tsx` with semantic mappings: `topicIcon()`
for conversation starters, `momentIcon()` for the Frases filter chips,
`grammarIcon()` for exercises-taxonomy topics. **Never** fall back to a
generic icon library or reintroduce emoji on app surfaces.

## 5. Named rules

**The one-green-block rule.** One deep-green mass per screen. A second green
block means the screen is overcommitted — demote one to a `surface` card.

**The spot-terracotta rule.** Terracotta marks at most one state per screen.
Progress uses green and cream only (three-segment bars, `#E0D8C9` empty) — no
amber, no red, anywhere.

**Everything labelled.** No icon-only mystery buttons in the voice console:
every control ≥ 56px with a text label under it.

**Ends above the nav.** Screen content must finish above the 86px bottom nav.
On Hoy that caps "Frases para usar hoy" at two cards.

**Corrections are calm.** The mis-said span gets a 2px terracotta underline
(offset 3px) inside the bubble; the recast sits below in a `terracotta-tint`
card with a check disc. Translations are a fold inside the bubble behind a
hairline — never a competing block.

## 6. Do's and Don'ts

### Do:
- **Do** reproduce the palette exactly — these hex values are final; don't
  drift them or add colours.
- **Do** keep touch targets ≥ 44px (voice controls ≥ 56px). The user is
  holding a baby.
- **Do** use the recessed well (`clay-recessed`) for every text input —
  inputs are pressed into the clay, raised things are buttons.
- **Do** wrap chip rows onto multiple lines so every pill shows whole, lip
  included. (Deliberate departure from the handoff, which ran chip rows off
  the right edge as a scroll cue — Bart preferred full pills, Aug 2026.)

### Don't:
- **Don't** use emoji, lucide, or any icon library on app surfaces.
- **Don't** use red, amber, or any status colour outside the palette.
- **Don't** float anything: no blur, no glassmorphism, no ambient drop
  shadows except the sanctioned green-hero throw.
- **Don't** add streak pressure, badges, or completion percentages; the
  streak pill is quiet and hides at zero.
- **Don't** use bounce or elastic easing, and don't animate layout properties.
- **Don't** put the settings/streak chrome on any screen but Hoy.
