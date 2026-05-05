---
name: Hablaba
description: Warm, calm Spanish practice for parents raising bilingual babies
colors:
  olive-branch: "#3a7a2e"
  honeycomb: "#c49a3a"
  linen: "#f3ede2"
  warm-parchment: "#faf6ee"
  espresso: "#3d3028"
  oat-milk: "#ece5d8"
  soft-clay: "#e8e0d2"
  morning-ember: "#c04a2a"
typography:
  display:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(1.75rem, 5vw, 2.5rem)"
    fontWeight: 400
    lineHeight: 1.15
  headline:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.3
  body:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  sm: "8px"
  md: "10px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.olive-branch}"
    textColor: "{colors.warm-parchment}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.olive-branch}"
  button-secondary:
    backgroundColor: "{colors.oat-milk}"
    textColor: "{colors.espresso}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-ghost:
    textColor: "{colors.espresso}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  chip:
    backgroundColor: "{colors.oat-milk}"
    textColor: "{colors.espresso}"
    rounded: "{rounded.full}"
    padding: "6px 14px"
  card:
    backgroundColor: "{colors.warm-parchment}"
    rounded: "{rounded.xl}"
    padding: "16px"
  input:
    backgroundColor: "{colors.oat-milk}"
    textColor: "{colors.espresso}"
    rounded: "{rounded.full}"
    padding: "10px 16px"
  chat-bubble-user:
    backgroundColor: "{colors.olive-branch}"
    textColor: "{colors.warm-parchment}"
    rounded: "{rounded.xl}"
    padding: "12px 16px"
  chat-bubble-bot:
    backgroundColor: "{colors.oat-milk}"
    textColor: "{colors.espresso}"
    rounded: "{rounded.xl}"
    padding: "12px 16px"
---

# Design System: Hablaba

## 1. Overview

**Creative North Star: "The Morning Kitchen"**

Hablaba feels like a warm kitchen in the morning: unhurried light through the window, a cup of something warm in your hands, a child nearby. Everything is within reach. Nothing demands attention; things are simply there when you need them. The palette is drawn from natural materials: herbs, honey, linen, clay, wood.

This is not a classroom. There are no scoreboards, no badges, no mascots bouncing for attention. The interface recedes so the language can come forward. Spanish appears naturally, the way it would on a jar in a market or a note on the fridge, not inside flashcard boxes or drill grids.

The system explicitly rejects Duolingo's gamified loudness, Busuu's utilitarian courseware aesthetic, and the generic SaaS pattern of cold blues, progress bars, and achievement badges. If someone could mistake this for a language-learning app from 2018, something has gone wrong.

**Key Characteristics:**
- Warm earthy palette rooted in greens, golds, and creams
- Generous whitespace; screens breathe
- Serif brand type (Fraunces) for personality, sans (DM Sans) for clarity
- Flat surfaces with tonal layering; no drop shadows
- Touch targets sized for one-handed use
- Motion is gentle and purposeful; never performative

## 2. Colors: The Morning Kitchen Palette

A restrained palette of earthy tones. The primary green carries interaction; the golden accent warms moments of encouragement. Everything else is cream, clay, and espresso. High chroma is rare and intentional.

### Primary
- **Olive Branch** (`oklch(0.45 0.12 145)`): Buttons, links, user chat bubbles, active states. The single interactive color. Used on no more than 15% of any screen.

### Secondary
- **Honeycomb** (`oklch(0.75 0.12 55)`): Encouragement moments, streak warmth, accent highlights. Sparingly applied to draw the eye to positive feedback.

### Neutral
- **Warm Parchment** (`oklch(0.99 0.005 75)`): Card surfaces, chat area background. The lightest layer.
- **Linen** (`oklch(0.97 0.01 75)`): Page background. Slightly warmer than Parchment to create subtle depth without shadows.
- **Oat Milk** (`oklch(0.94 0.02 75)`): Secondary surfaces, input fields, suggestion chips, bot chat bubbles. The "recessed" surface.
- **Soft Clay** (`oklch(0.9 0.02 75)`): Borders, dividers, subtle delineation. Never heavy.
- **Espresso** (`oklch(0.25 0.02 50)`): Primary text. A dark brown, never pure black.

### Destructive
- **Morning Ember** (`oklch(0.577 0.245 27.325)`): Error states and destructive actions only. Never decorative.

### Named Rules
**The Olive Branch Rule.** Green is for doing things. If an element is not interactive or actively selected, it does not get Olive Branch. Its scarcity is what makes it trustworthy.

**The No Pure Black Rule.** Every dark value is tinted warm. `#000` and `#fff` are prohibited. The darkest value in the system is Espresso; the lightest is Warm Parchment.

## 3. Typography

**Display Font:** Fraunces (with Georgia fallback). An optical-size variable serif with personality. Used for the brand name, page titles, and moments that should feel human and warm.

**Body Font:** DM Sans (with system-ui fallback). A clean geometric sans that stays out of the way. Handles UI text, labels, chat messages, and everything functional.

**Mono Font:** Geist Mono. Reserved for any future code or technical display.

**Character:** Fraunces brings the warmth of a handwritten note; DM Sans keeps everything legible at speed. The pairing says "friendly but clear," like a bilingual parent who switches registers effortlessly.

### Hierarchy
- **Display** (Fraunces 400, clamp(1.75rem, 5vw, 2.5rem), line-height 1.15): Brand name "Hablaba", page-level headings. Rare. One per screen maximum.
- **Headline** (Fraunces 400, 1.25rem, line-height 1.3): Section titles, card headings, daily prompts. The workhorse serif size.
- **Body** (DM Sans 400, 1rem, line-height 1.5): Chat messages, descriptions, explanatory text. Capped at 65ch line length.
- **Label** (DM Sans 500, 0.875rem, line-height 1.4): Chips, buttons, metadata, timestamps, secondary information.

### Named Rules
**The One Serif Rule.** Fraunces appears in Display and Headline roles only. Body text, labels, buttons, and inputs are always DM Sans. Mixing serif into functional text muddies the hierarchy.

## 4. Elevation

This system is flat. Depth is conveyed through tonal layering: Linen (page) → Warm Parchment (card) → Oat Milk (recessed input). No box-shadows on surfaces at rest. The only shadow in the system is a subtle focus ring glow.

Hover states use opacity shifts (primary/90) rather than elevation changes. Active states use a subtle scale transform (0.98) for tactile feedback. This keeps the interface grounded, like objects resting on a table rather than floating above it.

### Named Rules
**The Flat Table Rule.** Nothing floats. Surfaces sit on the table. If you reach for `box-shadow` on a card or container, use a background-color shift instead. Shadows are permitted only on focus rings and overlays (sheets, popovers) where z-axis stacking is real.

## 5. Components

### Buttons
- **Shape:** Gently rounded (10px radius), never pill-shaped for primary actions.
- **Primary:** Olive Branch background, Warm Parchment text. Padding 8px 16px. Height 36px.
- **Hover:** opacity 90%. No shadow, no scale.
- **Active:** scale(0.98) for press feedback.
- **Focus:** 3px ring in Olive Branch at 50% opacity.
- **Secondary:** Oat Milk background, Espresso text. Same shape.
- **Ghost:** Transparent background, Espresso text. Hover reveals Oat Milk background.
- **Icon buttons:** 36px square, same radius. Used for back arrows, settings, send.

### Chips
- **Style:** Pill-shaped (full radius), Oat Milk background, Espresso text. Label-size type.
- **Interaction:** Horizontal scroll container. No wrapping. Tap to select; selected state uses Olive Branch background with Warm Parchment text.
- **Purpose:** Suggestion prompts in chat, topic filters. Always feel optional, never like required steps.

### Cards / Containers
- **Corner Style:** Generous rounding (16px radius).
- **Background:** Warm Parchment on Linen page, or Oat Milk for grouped/recessed content.
- **Border:** 1px Soft Clay. Subtle, never heavy.
- **Internal Padding:** 16px default, 12px for compact cards.
- **Hover:** Background shifts to secondary/50 opacity. Active scale(0.98).
- **No shadows.** Depth through tonal layering only.

### Inputs / Fields
- **Style:** Pill-shaped (full radius), Oat Milk background, no visible border at rest.
- **Focus:** 2px ring in Olive Branch at 20% opacity. Background stays Oat Milk.
- **Error:** Ring shifts to Morning Ember at 50% opacity.
- **Chat input:** Full-width, same pill style. Send button is a circular Olive Branch icon button flush against the right edge.

### Navigation
- **Tab bar:** Pill-shaped segment control. Oat Milk background container.
- **Active tab:** White background with subtle shadow, smooth slide transition.
- **Inactive tab:** Transparent, Espresso text at muted opacity.
- **Typography:** Label size (DM Sans 500, 0.875rem).

### Chat Bubbles (Signature Component)
The heart of the app. User messages sit right-aligned in Olive Branch with Warm Parchment text, rounded on all corners except bottom-right (squared for a "tail" effect). Bot messages sit left-aligned in Oat Milk with Espresso text, rounded except bottom-left. Max width 85% of container. Corrections appear inline as gentle callouts, never as separate error cards. The feel is a friendly text conversation, not a chatbot interface.

## 6. Do's and Don'ts

### Do:
- **Do** use Olive Branch exclusively for interactive elements and active states. Its restraint is what makes it meaningful.
- **Do** vary spacing between sections for visual rhythm. Generous padding between major blocks (32-48px), tighter within groups (8-16px).
- **Do** show Spanish in natural context: full sentences, routine phrases, conversational fragments. Never isolated vocabulary in boxes.
- **Do** ensure all touch targets are at least 44x44px. The user is holding a baby.
- **Do** respect `prefers-reduced-motion`. Disable scale transforms and transitions for users who request it.
- **Do** test contrast ratios on every Oat Milk / Soft Clay combination. Warm light palettes are easy to under-contrast.

### Don't:
- **Don't** use gamification patterns: streaks that punish, achievement badges, leaderboards, XP counters, progress bars. This is not Duolingo.
- **Don't** make the interface feel like courseware: numbered lessons, locked levels, completion percentages. This is not Busuu.
- **Don't** use cold blues, corporate grays, or dashboard-dense layouts. This is not SaaS.
- **Don't** use `#000` or `#fff`. Every value is warm-tinted.
- **Don't** use box-shadows on cards or containers. Depth is tonal.
- **Don't** nest cards inside cards. If you need hierarchy, use spacing and type scale.
- **Don't** use gradient text, glassmorphism, or colored side-stripe borders.
- **Don't** use border-left or border-right greater than 1px as a colored accent on any element.
- **Don't** use bounce or elastic easing. Motion is calm: ease-out-quart or ease-out-expo only.
- **Don't** add competing calls to action. One primary action per screen. Everything else is secondary or ghost.
