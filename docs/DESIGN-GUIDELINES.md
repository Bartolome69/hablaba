# Hablaba — Design Guidelines

> For product vision and feature roadmap, see [VISION.md](../VISION.md).

---

## Principles

1. **Warm, not clinical** — this is a parenting app. Avoid cold or sterile UI. Prefer rounded forms, warm neutrals, and friendly typography.
2. **Low friction** — parents use this mid-routine, one-handed, often distracted. Every interaction should be immediately obvious and reachable with a thumb.
3. **Mobile-first** — designed for a phone in portrait orientation. Desktop is a bonus, not a target.
4. **No guilt** — avoid red states, harsh feedback, or language that implies failure. Neutral and encouraging tones only.
5. **Reduce noise** — show only what's needed for the current task. Progressive disclosure over information overload.

---

## Color Palette

Colors use the **OKLch color space** for perceptually uniform lightness. Defined as CSS variables in `app/globals.css`.

### Semantic tokens (use these in components)

| Token | Light value | Usage |
|-------|------------|-------|
| `background` | `oklch(0.97 0.01 75)` | Page background — warm off-white |
| `foreground` | `oklch(0.25 0.02 50)` | Primary text — warm near-black |
| `card` | `oklch(0.99 0.005 75)` | Card surfaces — slightly lighter than background |
| `primary` | `oklch(0.45 0.12 145)` | Green — CTAs, active states, ring |
| `secondary` | `oklch(0.94 0.02 75)` | Pill backgrounds, subtle containers |
| `muted-foreground` | `oklch(0.5 0.02 50)` | Labels, captions, inactive tab text |
| `accent` | `oklch(0.75 0.12 55)` | Amber/orange — streak badge, highlights |
| `border` | `oklch(0.9 0.02 75)` | Card and input borders |

### Color usage rules

- **Primary green** (`bg-primary`, `text-primary`) — one dominant CTA per screen. Never use it for more than one element at the same hierarchy level.
- **Accent amber** — reserved for the streak badge and progress highlights. Do not repurpose for general UI.
- **Secondary** — use for pill toggles, chip backgrounds, and subtle containers. Not for interactive elements that need affordance.
- **Avoid custom hex values** — always use the semantic token system. If a new color is needed, add it to `globals.css` first.

---

## Typography

| Role | Font | Class |
|------|------|-------|
| Body, UI labels | DM Sans | `font-sans` (default) |
| Display, headings | Fraunces | `font-serif` |

### Usage

- **`font-serif`** — app name ("Hablaba"), section display headings, Spanish text that deserves visual weight
- **`font-sans`** — everything else: labels, body copy, buttons, captions
- **Sizes**: stick to Tailwind's scale (`text-xs`, `text-sm`, `text-base`, `text-lg`, `text-2xl`). Avoid arbitrary sizes.
- **Weights**: `font-medium` for labels, `font-semibold` for headings and active states, `font-normal` for body

---

## Spacing & Layout

- Page padding: `px-4 py-6` — consistent horizontal/vertical rhythm
- Bottom padding on scrollable pages: `pb-8` minimum (account for safe area on iOS)
- Card gap: `gap-3` in grids, `space-y-3` or `space-y-4` in lists
- Section spacing: `mb-8` between major sections

---

## Border Radius

| Token | Value | Tailwind class | Use |
|-------|-------|----------------|-----|
| `--radius` | `0.75rem` | `rounded-lg` | Inputs, small elements |
| `--radius + 4px` | `1rem` | `rounded-xl` | Buttons |
| — | `1rem` | `rounded-2xl` | Cards, containers |
| — | `9999px` | `rounded-full` | Pills, badges, toggles |

Cards always use `rounded-2xl`. Pill-shaped controls (toggles, badges) always use `rounded-full`.

---

## Component Patterns

### Cards

```tsx
<div className="flex flex-col gap-2 p-4 bg-card border border-border rounded-2xl">
```

- Surface: `bg-card`
- Border: `border border-border`
- Radius: `rounded-2xl`
- Internal padding: `p-4`
- Interactive cards add: `hover:bg-secondary/50 active:scale-[0.98] transition-all`

### Pill Toggle (navigation/selection)

```tsx
<div className="flex items-center bg-secondary rounded-full p-1">
  <button className="flex-1 px-4 py-1.5 rounded-full text-sm font-medium transition-all
    bg-background text-foreground shadow-sm">  {/* active */}
    Active
  </button>
  <button className="flex-1 px-4 py-1.5 rounded-full text-sm font-medium transition-all
    text-muted-foreground">  {/* inactive */}
    Inactive
  </button>
</div>
```

Used for: Speak/Practice tab toggle, voice gender selector.

### Primary Button

```tsx
<button className="w-full flex items-center justify-center gap-3 p-4
  bg-primary text-primary-foreground rounded-2xl
  hover:opacity-95 active:scale-[0.98] transition-all">
```

### Ghost/Secondary Button

```tsx
<button className="px-3 py-1 rounded-full text-sm text-muted-foreground
  hover:text-foreground transition-colors">
```

### Badges

```tsx
{/* Streak badge */}
<div className="flex items-center gap-1.5 bg-accent/30 px-3 py-1.5 rounded-full">
  <Flame className="w-4 h-4 text-accent" />
  <span className="text-sm font-semibold text-foreground">{count}</span>
</div>
```

---

## Interaction & Motion

- **Press feedback**: `active:scale-[0.98]` on all tappable cards and buttons
- **Hover**: `hover:bg-secondary/50` on cards, `hover:opacity-95` on primary buttons
- **Transitions**: `transition-all` or `transition-colors` — always present on interactive elements
- **No heavy animations** — avoid entrance animations, slides, or anything that adds latency to the feel of the app

---

## Icons

Use [Lucide React](https://lucide.dev) exclusively. Do not mix icon libraries.

- Size: `w-4 h-4` for inline/label icons, `w-5 h-5` for standalone action icons
- Color: inherit from text color, or use semantic tokens directly (`text-accent`, `text-muted-foreground`)

---

## Navigation

- **Top pill toggle** — Speak | Practice — lives inside `AppHeader`, full width, same pattern as voice toggle
- **Chat page** — uses its own `ChatHeader` with a back-to-home button. No tab toggle shown in chat.
- **No bottom nav** — two tabs don't warrant a bottom bar. Revisit if a third tab is added.

---

## Writing Style (UI Copy)

- Labels and headings: sentence case, not title case — "Start a conversation", not "Start A Conversation"
- Spanish content: always paired with English translation in a smaller, muted style beneath
- Avoid instruction-heavy copy — "Tap to hear" is better than "Click this button to hear the audio pronunciation"
- Tone: warm and practical. Not gamified, not clinical.
