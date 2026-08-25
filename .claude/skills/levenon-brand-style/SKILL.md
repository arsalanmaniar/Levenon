---
name: levenon-brand-style
description: Single source of truth for Levenon's brand — color tokens, typography, spacing, and the "thread" motif rules. Load this before writing or reviewing ANY Levenon UI, 3D, or motion code so components stay on-brand without re-explaining the system. Triggers on any Levenon component, page, section, Tailwind class choice, color/type decision, 3D material or lighting choice, divider/loader/hover state, or copywriting for the site.
---

# Levenon Brand & Style System

Derived from `Levenon-Logo.png`. These tokens are **locked**. Do not invent new colors,
fonts, or radii. If a design need isn't covered here, compose from what's below or ask.

---

## 1. The Core Idea

The wordmark is a bold geometric sans in near-black, and the middle **"e" is a purple
outlined ring/loop — a thread**. That single thread is the visual DNA of the entire site.
It reappears as the 3D hero sculpture, section dividers, loaders, hover underlines, and
scroll-linked stitching.

**Tone:** precise, tailored, minimal. Tailoring vocabulary ("thread", "stitch", "seam",
"cut", "weave") runs through both copy and visuals.

### The one rule that keeps this site distinct

> **Light-first. Paper background, black type, purple 3D sculptural accents.**

Do **NOT** default to the black-background neon "3D website" cliché. Default background is
`--paper`, never pure white. Exactly **one** section on the page inverts to dark in the light
theme (see §6) — that inversion is a rhythm device and loses all its power if repeated.

**Dark theme exists, and it does not contradict this rule.** It is a *reader's* choice
(`prefers-color-scheme`, or the nav toggle), not a design default — the site still ships
light-first, still opens light-first for a visitor with no preference recorded, and the dark
palette is the same token *system* with swapped values, not a second design. See the dark
column in §2 and the inversion rule in §6.

---

## 2. Color Tokens

Declared once in `app/globals.css` on `:root`, consumed through Tailwind theme keys.

| Token | Hex | Role |
|---|---|---|
| `--ink` | `#0B0B0D` | Wordmark, headlines, primary text. Near-black — never `#000` on paper. |
| `--paper` | `#FBFAF8` | Base background. Warm off-white. **Never pure white.** |
| `--purple-700` | `#5B1A9E` | Deep accent — pressed states, gradient ends, dark-on-light emphasis. |
| `--purple-500` | `#7C2AE8` | **Primary accent.** The thread color. Sculpture, links, focus rings. |
| `--purple-300` | `#B98CF2` | Light accent — hover, and the thread color *inside the dark section*. |
| `--charcoal` | `#5B5A5F` | Secondary text, captions, muted labels. |
| `--hairline` | `#EAE8E2` | Borders, dividers, card outlines. |
| `--success` | `#2D7A4F` | **The only non-purple accent.** Confirmation states solely — a valid discount code, a completed signup. **5.02:1 on `--paper`**, so it passes AA for normal text. Never a surface, never a border, never decorative. |

Tailwind mapping (already configured): `bg-paper`, `text-ink`, `text-charcoal`,
`border-hairline`, `text-purple-500`, `bg-purple-700`, `text-purple-300`.

### Dark theme — the same tokens, swapped values

Driven by `next-themes` writing `data-theme="dark"` on `<html>`; CSS keys off
`[data-theme="dark"]` in `app/globals.css`. **No component ever branches on theme** — every
colour on the site already resolves through these seven custom properties, so a theme is a
value swap, never a second set of components or a `dark:` class scattered through the JSX.

| Token | Light | Dark | Contrast (dark, on `--paper`) |
|---|---|---|---|
| `--ink` | `#0B0B0D` | `#F2F0EC` | 16.94:1 |
| `--paper` | `#FBFAF8` | `#0F0E0D` | — (the ground) |
| `--hairline` | `#EAE8E2` | `#2A2926` | 1.33:1 — decorative, same as light (1.17:1); dividers are not controls in either theme |
| `--charcoal` | `#5B5A5F` | `#A8A6A2` | 7.94:1 |
| `--success` | `#2D7A4F` | `#4CAF7D` | 7.10:1 |
| `--purple-700` / `--purple-300` | unchanged | unchanged | `--purple-300` is 7.43:1 — the accent that carries **text** in dark |
| `--purple-500` | `#7C2AE8` | **remapped to `#B98CF2`** | Literal `--purple-500` is 3.08:1 on dark paper and cannot carry text. Rather than hunt down every `text-purple-500` hover state across the site, the *token* is remapped for the duration of dark theme — same class name, same call sites, correct contrast everywhere at once. `--purple-300` is left at its own value; the two tokens simply converge in dark mode outside the atelier (see below). |

All measured **before** being written to any file, not after — if a future token change fails
its pair's contrast, that is a blocker, not a note to fix later.

### Usage rules
- Purple is an **accent**, not a surface. Never large purple fills on paper; purple earns its
  place as a 1px line, a ring, a glow, or the 3D sculpture.
- Cards and surfaces are `--paper` (or near-white only when a card must lift off the paper),
  always bounded by a **1px `--hairline` border** — never a drop shadow as the primary
  separator. Shadows, when used, are soft and purple-tinted, never gray-black.
- Body copy is `--ink`; supporting copy is `--charcoal`. There is no third text color.
- `--success` marks a state, never a thing. It may tint a confirmation's text and its glyph and
  nothing else — no success buttons, no success panels, no success borders. **It must never be the
  only carrier of the message**: a tick glyph and a plain-language label always accompany it, so the
  meaning survives greyscale, colour-blindness, and a screen reader. There is deliberately no
  matching error colour — failure states stay `--charcoal` with words that say what to do.
  **Narrow, disclosed exception (2026-08-23):** a channel-identifying icon glyph — e.g. the PDP's
  WhatsApp `Phone` icon — may carry `--success` when it labels an external channel rather than a
  state. The control it sits inside must still use ink/hairline for its surface and border; only
  the glyph itself takes the colour. This is an icon-only carve-out, not a reopening of "no success
  buttons" — a green *button* is still forbidden.
- In the dark section, roles swap: bg `--ink`, text `--paper`, accent `--purple-300`.

---

## 3. Typography

| Role | Family | Weights | Used for |
|---|---|---|---|
| Display | **Manrope** | 700 / 800 | Headlines, wordmark, section titles, big numerals (800); product card names only (700) |
| Body | **Inter** | 400 / 500 | Paragraphs, nav links, buttons, descriptions |
| Utility | **IBM Plex Mono** | 400 / 500 | Eyebrows, tags, prices, SKUs, counters, labels |

Loaded via `next/font/google` and exposed as `font-display`, `font-sans`, `font-mono`.

### Rules
- **Display**: weight 800 only, `tracking-tight` (-0.02em to -0.04em at large sizes),
  `leading-[0.95]`–`leading-[1.05]`. Headlines are set tight and large; they carry the page.
- **Utility/mono**: always `uppercase`, `tracking-[0.18em]`, small (`text-[11px]`–`text-xs`).
  Every eyebrow, price, size chip, and SKU is mono. This is a signature — use it consistently.
- **Body**: `leading-relaxed`, max measure ~65ch. Never justify.
- Sentence case for headlines; UPPERCASE reserved for mono utility text only.

### Headline scale — three named tiers, not a free choice per page

| Tier | Size | Where |
|---|---|---|
| **Hero H1** | `clamp(3.75rem, 8vw, 6.25rem)` (~100px desktop) | The home page hero only. One per site. |
| **Page H1** | `clamp(2rem, 5vw, 3.25rem)` (~52px desktop) | Every other page's `<h1>` — a PDP, `/track`, `/wishlist`. |
| **Section H2** | `clamp(1.75rem, 4vw, 2.5rem)` Manrope 800 | Named subsections inside a page — a PDP's "Reviews", "More from this fabric". |

Raised from ~84px to ~100px in the UI-overhaul pass (2026-08-22): at real laptop viewports the
84px hero read as one modest headline floating over a large field of empty paper — the hero
needed to visually command the first screen, not just label it. The floor also moved up, from
`2.75rem` to `3.75rem` (44px → 60px), so phones get the same weight increase rather than only
wide screens.

Before this tier existed, section headings on non-home pages were set as 11px mono eyebrows —
correct for a label, wrong for a heading a reader is meant to actually read as a heading. That
produced a 41px cliff straight from the 52px page H1 to an 11px eyebrow with nothing between.
Section H2 exists to fill that gap; it is not interchangeable with either H1 tier and it is not
a mono eyebrow rendered bigger; it is regular Manrope 800, unstyled by `.label`.

The 84px hero tier is **not** a general "biggest heading" size — it belongs to the one page that
opens the whole site's story. Reaching for it on a PDP or a utility page overstates what that
page is.

**Narrow, disclosed exception (2026-08-23):** the PDP's own `<h1>` (the product name) is set at
32px/700 (`text-[2rem] font-bold`), a step below the locked Page H1 tier above, per an explicit
later brief asking for it to sit quieter beside the price and rating row rather than dominate the
right column. This is scoped to that one element — `/track` and `/wishlist` still use the Page H1
tier unchanged.

---

## 4. Space, Line & Shape

- **Spacing scale:** 4px base. Section vertical rhythm: `py-24` mobile → `py-32`/`py-40` desktop.
  Generous whitespace is part of the brand — when unsure, add space, not decoration.
- **Container:** `max-w-[1400px]`, gutters `px-6` mobile / `px-10` desktop.
- **Radii:** `rounded-none` for structural blocks and cards (tailored, not soft),
  `rounded-full` for pills, chips, buttons, and anything referencing the ring motif.
  Avoid mid-range radii (`rounded-lg`, `rounded-xl`) — they read generic.
- **Borders:** 1px `--hairline` everywhere. Purple 1px only to mark active/focus.
- **Grid:** 12-column desktop. Product grid: 1 col mobile, 2 col `sm`, 3 col `lg`, 4 col `2xl`.

---

## 5. The Thread Motif — Rules

The thread is the brand. It must appear in each of these forms, and **only** these forms:

1. **The ring** — an open purple circle/torus echoing the "e". Used for: the 3D hero
   sculpture, loaders (rotating arc), bullet markers, and the hover state on nav links.
2. **The stitch line** — a horizontal dashed purple rule used as a section divider.
   SVG `stroke-dasharray: 6 8`, `stroke-width: 1`, color `--purple-500` at 40–60% opacity.
3. **The scroll stitch** — a vertical/curving dashed path that "sews" between sections,
   drawn by animating `stroke-dashoffset` as the user scrolls (GSAP ScrollTrigger).
4. **The 3D knot** — a purple thread-knot form (torus knot / tube geometry) that rotates
   slowly, reacts to mouse, and casts a soft purple glow onto the surface below it.
5. **The mote field** — short dash sprites drifting slowly, reading as loose threads in the
   air. `--purple-500` / `--purple-300` only. **Max 120 particles.** Mouse-proximity
   reaction permitted. **Permitted in the `ThreadSculpture` component only — hero variant and
   atelier variant both. Not permitted in product cards, drawers, or any flat UI context.**
6. **The drawn line** — a hairline that scales in from zero width on hover/focus, `scaleX(0)`
   → `1`, 300ms `ease-state`, always `--purple-500`. This is form 2 read as an interaction
   instead of a static divider — a thread being drawn taut, not a swoosh. Used on the product
   card's bottom edge (hover) and the nav link underline (hover/focus). Never a full underline
   that is simply visible at all times; the drawing motion is the point.

### Motif discipline
- **One bold 3D moment per section — never animation everywhere.** The hero sculpture is
  *the* wow moment; everything around it stays quiet.
- The thread never becomes a decorative squiggle, a swoosh, a gradient blob, or a particle
  cloud for its own sake. It is a single continuous line with tension. **Form 5 is the one
  exception and it is a narrow one**: dashes, not points — they read as cut threads, which is
  the stitch in three dimensions, not as dust or stars. Round sprites are still forbidden.
  The bound is a hard 120, not a starting figure.
- Line weight stays hairline-thin. A fat purple tube reads as a toy, not a thread.
- Glow/bloom on the sculpture only, subtle (intensity ≈ 0.3–0.7). Nothing else bloom-lit. Raised
  from a 0.6 ceiling to 0.7 in the UI-overhaul pass — the atelier's floor glow was reading as
  "barely a circle" rather than a visible pool of light; the sculpture's own scale went up in the
  same pass (hero ×1.32, atelier ×1.22), so check both together before tuning either alone.

---

## 6. Section Rhythm

Standard page rhythm, top to bottom:

1. Nav — paper, hairline bottom border, mono utility links.
2. Hero — paper, huge display headline + 3D thread sculpture, soft purple floor glow.
3. Stitch divider — dashed purple rule.
4. Product grid — paper, hairline-bordered cards, mono prices, mouse-tilt 3D on hover.
5. **Dark signature section (the atelier)** — inverts to `--ink` background, `--paper` text,
   `--purple-300` thread sculpture. **Exactly one per page.** This is the rhythm beat.
6. Newsletter — paper, quiet, directly after the atelier rather than before it. It is the last
   soft ask before the footer, not a second paper block sandwiched against the grid with the
   rhythm beat still to come.
7. Footer — paper, hairline top border, mono links, wordmark with the purple ring "e".

### No dead viewports

Every full-bleed section hands off to the next with nothing to scroll past — no empty band of
paper between the hero and the first product, no section that exists only to create space. If a
gap between two sections is doing nothing but separating them, that is the previous section's
`py-*` bottom padding, not a section of its own. This does not relax the generous-whitespace rule
in §4 — space *inside* a section is still the default when unsure — it only forbids a whole
viewport of nothing between two sections that both have content.

### Editorial discovery layout

For a rail that introduces a small, curated set of products (a "New arrivals" or "Edit N" rail
sitting directly under the hero) — **one large card plus a column of smaller ones, never a
uniform grid.** `grid md:grid-cols-3 md:grid-rows-3`, the lead card spanning
`md:col-span-2 md:row-span-3`. This is deliberately a different rhythm from the full collection
grid in §6 point 4 (equal-weight, hairline-bordered cards): the discovery rail is making an
editorial claim about which pieces matter most this season, the full grid is offering everything
on equal footing. Below `md` both collapse to a single stacked column — the asymmetry is a
desktop-width statement, not a mobile one.

### PDP sticky sidebar

On the product page, the image gallery column stays `sticky` (`lg` and up only) while the
right-hand column — name, price, size selector, accordion — scrolls past it. The gallery is
~58% of the row, the right column ~42%, read off the locked 12-column grid (`lg:col-span-7` /
`lg:col-span-5`) rather than literal 55/45 percentages — three points off a round-number brief is
not worth stepping outside the grid system for. Below `lg` both columns stack in document order
(gallery first) and nothing is sticky; the sticky behaviour is a wide-viewport-only affordance so
scrolling to a longer accordion doesn't strand the imagery below the fold on a phone.

### The atelier inversion rule, and how dark theme interacts with it

The atelier's whole job is to be the *one* moment the page goes dark against a light page
around it. In dark theme the page is **already** dark, so an atelier that stayed `bg-ink` would
invert nothing — the beat would vanish exactly where the rest of the site is trying hardest to
earn it.

**The fix costs nothing extra, because the section is already written in tokens, not
literals.** `bg-ink text-paper` on the atelier's wrapper is not touched by theme at all — when
`--ink`/`--paper` swap globally in dark theme, the SAME markup reads as the light block instead,
automatically. The section still shows two states across the two themes: dark-on-light in light
theme, light-on-dark in dark theme. It is always the section that *isn't* the colour of the page
around it — that is the invariant to hold, not "the atelier is always literally black".

Two consequences that follow from this and must not be re-broken by a future change:

- **Do not re-declare `--ink`/`--paper` inside a `.dark-section`-scoped override "to make it
  dark".** That cancels the global swap and pins the section to one colour regardless of theme,
  which is the opposite of the rule above. If the section ever needs to look literally the same
  in both themes, that is a new, deliberate design decision — not a one-line "fix".
- **The 3D sculpture inside must track which surface it is actually sitting on, not a
  hardcoded prop.** The hero sits on `--paper`; the atelier sits on `--ink`. Whichever of those
  two currently resolves *dark* is the instance that should render the `dark`-variant material
  (lighter purple-300 accent, no contact shadow — a contact shadow on a dark ground renders as a
  glowing rectangle instead of a shadow) and get the bloom pass; the instance on the *light*
  ground gets the `light`-variant material and the floor glow instead. In light theme that is
  the atelier; in dark theme it is the hero. `components/3d/thread-canvas.tsx` computes this
  live, off the DOM's `data-theme` attribute — read that file before assuming a sculpture's
  "variant" prop still means "which section is this" once theme is involved; it stopped meaning
  that the moment theming shipped.

---

## 7. Motion Principles

- **Easing:** `cubic-bezier(0.16, 1, 0.3, 1)` (expo-out) for entrances;
  `cubic-bezier(0.65, 0, 0.35, 1)` for state changes. No bounce, no elastic, no spring
  overshoot on layout — the brand is tailored, not playful.
- **Durations:** micro-interactions 150–250ms, reveals 600–900ms, sculpture idle rotation
  is continuous and slow (a full turn measured in tens of seconds, never seconds).
- **Reveals:** text and cards enter with a small translate-up (16–24px) + fade. Never scale-in,
  never blur-in, never slide from off-screen sides. The atelier/signature section's copy column
  briefly carried a scoped exception (2026-08-23) sliding in from the right instead; a later brief
  (2026-08-25) retired it in favour of the standard rise-and-fade, so `Reveal`'s `from="right"`
  direction is currently unused sitewide but kept on the component for any future scoped need.
- **Card tilt:** max ±8° rotation, damped/eased toward the pointer, returns to rest on leave.
  Real perspective (`transform-style: preserve-3d`), not a flat CSS shadow fake.
- **`prefers-reduced-motion: reduce` is non-negotiable.** Under it: no parallax, no scroll-linked
  camera moves, no idle rotation, no tilt. Reveals collapse to a plain opacity fade or appear
  instantly. The 3D scene renders a single static frame rather than animating.

---

## 8. Accessibility Floor

- Contrast: `--ink` on `--paper` and `--paper` on `--ink` both pass AAA. `--charcoal` on
  `--paper` passes AA for body sizes. **`--purple-500` on `--paper` is ~5.9:1 — fine for body
  text and UI, but do not use `--purple-300` for text on paper** (it fails); `--purple-300` is
  for the dark section and for non-text accents only.
- Every interactive element has a visible focus ring: 2px `--purple-500`, 2px offset. Never
  remove outlines without replacement.
- The 3D canvas is decorative: `aria-hidden`, not focusable, and the page must read and
  function completely with the canvas absent.
- Respect `prefers-reduced-motion` (§7) and keep hit targets ≥44px.

---

## 9. Copy Voice

Short, declarative, tailoring-literate. "Cut clean. Sewn to last." Not hype, no exclamation
marks, no "revolutionize". Mono eyebrows label things factually (`FW25 — 12 PIECES`).
Product names are plain nouns; the mono price does the talking.
