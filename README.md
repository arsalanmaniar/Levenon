# Levenon

3D clothing site. Light-first: paper background, ink type, one purple thread
sculpture as the loud moment. Brand rules live in
[`.claude/skills/levenon-brand-style/SKILL.md`](.claude/skills/levenon-brand-style/SKILL.md)
and are the single source of truth for colour, type, spacing, and the thread motif.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run typecheck  # tsc --noEmit
npm run lint
```

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind · React Three Fiber + drei ·
`@react-three/postprocessing` · GSAP + ScrollTrigger · Lenis · Framer Motion.

The 3D packages are pinned to the React 18 line (R3F 8.x / drei 9.x) because
R3F 9 requires React 19, which Next 14 does not ship.

## Layout

```
app/                     layout, page, tokens in globals.css
components/
  3d/                    thread-canvas → thread-scene → thread-sculpture
  sections/              nav, hero, product grid, dark signature, footer
  products/              card (mouse tilt) + generated placeholder visual
  ui/                    wordmark, button, reveal, stitch divider
  providers/             Lenis + GSAP ticker wiring
hooks/                   reduced motion, device capability, window pointer
lib/                     fonts, types, placeholder products, cn
.claude/                 brand skill + four scoped agents
```

## How the 3D degrades

`ThreadCanvas` is the only entry point; nothing outside `components/3d` imports
three.js. It dynamic-imports with `ssr: false` behind an IntersectionObserver, so
the renderer is fetched only when a section approaches the viewport, and the
initial HTML ships an SVG ring of identical size (no layout shift, no blocked
first paint).

| Condition | What renders |
|---|---|
| No WebGL, or context lost | SVG ring fallback |
| Low-tier device (≤4 cores / ≤4 GB / coarse pointer on small screen) | Simplified geometry, `dpr` 1, no contact shadow, no rim light, no bloom |
| `prefers-reduced-motion: reduce` | `frameloop="demand"` — one static frame, no idle rotation, no pointer reaction |
| Otherwise | Full scene, `dpr` capped at 1.75; bloom only in the dark section |

Reduced motion is handled the same way everywhere else: Lenis is never
constructed, ScrollTriggers are never built, card tilt is not wired. Nothing is
animated at zero duration — the animation simply is not created.

## Data

There is no external product database. The catalogue is defined in
`lib/server/catalogue-data.ts` and read through `lib/server/products.ts`, which
is the **only** seam between the app and storage — moving to Postgres/Supabase
means rewriting those function bodies and nothing else. Both modules are
`server-only`, so a stray client import fails the build.

Public REST API (used by client-side callers; Server Components read the data
layer directly rather than fetching the app's own HTTP endpoints):

| Route | Notes |
|---|---|
| `GET /api/products` | `?category=<slug>`, `?q=<text>`, `?limit=<int>` → `{ products, count }`; bad limit → 400 |
| `GET /api/products/:id` | id **or** slug → `{ product }` → 404 if unknown |

Two schema rules: money is integer minor units (paisa, never floats), and stock
lives on the variant — `inStock` is derived, never stored.

## Phases

- **Phase 1 — done.** UI: nav, hero + thread sculpture, product grid, dark
  signature section, footer.
- **Phase 2 — done.** Real schema (`lib/types.ts`), data layer, REST routes,
  grid wired to live data, product detail at `/product/[slug]` (the id also
  resolves, canonicalised to the slug) with on-brand loading, error, and 404
  states.
- **Phase 3 — done.** In-memory cart (variant-keyed, stock-capped), Framer Motion
  drawer with focus trap / `inert` background / scroll lock, nav badge,
  size-aware add-to-cart, and WhatsApp checkout via `lib/cart/checkout.ts`.

Set `NEXT_PUBLIC_WHATSAPP_NUMBER` (see `.env.example`) to enable checkout — it is
inlined at build time, so rebuild after changing it. Unset, the drawer shows an
explicit "Checkout unavailable" panel rather than a broken link.

Open items are tracked in `Levenon-Project-Spec.md` §6.
