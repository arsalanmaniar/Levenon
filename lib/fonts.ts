import { Manrope, Inter, IBM_Plex_Mono } from "next/font/google";

/**
 * Brand type stack. Display / body / utility — nothing else.
 * See .claude/skills/levenon-brand-style/SKILL.md §3
 */
export const display = Manrope({
  subsets: ["latin"],
  // 800 is the locked display weight (SKILL.md §3); 700 is added only for the
  // product card's name, which the UI-overhaul brief calls out specifically.
  // 500 and 600 are added for the client revision pass (2026-08-24): 500 for
  // the nav links, 600 for the product-card price, both moving off the mono
  // `.label` system onto Manrope at those specific weights.
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
  /*
   * `optional`, not `swap`. Measured with Lighthouse (GPU-accelerated
   * headless, cold cache — the worst case): with `swap`, the hero text
   * column reflows when Manrope finishes loading and the browser swaps it
   * in for the fallback, scoring CLS 0.22 — a hard Core Web Vitals fail,
   * and the ~100px hero H1 from this pass makes the swap's pixel delta
   * large enough to matter where a smaller headline mostly hid it.
   * `optional` uses Manrope only if it wins a ~100ms budget (self-hosted via
   * next/font and preloaded, so it usually does) or is already cached
   * site-wide after the first pageview; otherwise the page commits to the
   * fallback for that render instead of reflowing into the real font later.
   * Body (Inter) and mono keep `swap` — their line-height delta at that
   * point size never produced a measurable shift.
   */
  display: "optional",
});

export const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-sans",
  display: "swap",
});

export const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  /*
   * `optional`, for the same reason as Manrope above and confirmed the same
   * way — by measurement, not by analogy.
   *
   * With `swap`, the hero's mono footnote row (a `flex-wrap` row of three
   * `.label` items) laid out at **111px tall** against the fallback
   * monospace, because the wider fallback glyphs pushed the third item onto
   * a second line. When IBM Plex Mono arrived the row collapsed to **56px**,
   * taking the whole hero section from 984px to 892px and everything below
   * it up by 92px — CLS 0.24, an intermittent hard Core Web Vitals fail
   * (it only shows when the font misses first paint). Captured directly
   * with a PerformanceObserver on `layout-shift` plus a per-frame geometry
   * probe; the numbers above are measured, not estimated.
   *
   * Raising `.label` from 11px to 12px in this same pass is what pushed that
   * row over its wrap threshold, so this is a regression this pass created
   * and is fixing, not a pre-existing one being papered over.
   *
   * `optional` means the browser either has the face within its ~100ms
   * budget (usual, since next/font self-hosts and preloads it, and it is
   * cached site-wide after the first view) or commits to the fallback for
   * that render — either way there is no mid-flight metric swap, which is
   * the only thing that can move the row.
   */
  display: "optional",
});

export const fontVariables = `${display.variable} ${sans.variable} ${mono.variable}`;
