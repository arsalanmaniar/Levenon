"use client";

import Link from "next/link";
import { m } from "framer-motion";
import type { ReactNode } from "react";
import { Wordmark } from "@/components/ui/wordmark";

/** Always-dark panel, so literal hex rather than the theme-swapping `--ink`/`--paper` tokens — the same rule the hero and footer already follow. */
const PANEL_BACKGROUND = "linear-gradient(135deg, #1A0535 0%, #0B0B0D 70%)";

const TRUST_BADGES = ["48 Pieces", "6 Fabrics", "Free Returns"];

/**
 * Four concentric rings, each turning at its own rate (see `.auth-orbit-*`
 * in `globals.css`). Pure CSS — nothing here needs JS, and the `@media
 * (prefers-reduced-motion: no-preference)` guard those classes sit behind
 * is what stops them animating for a reader who asked for stillness,
 * without this component branching at all.
 *
 * `rounded-full` divs rather than one SVG: four nested circles is exactly
 * what a border-radius expresses, and it keeps each ring an independently
 * animatable element without an SVG transform-origin to fight.
 */
function OrbitDecoration() {
  return (
    <div aria-hidden="true" className="relative flex h-[200px] w-[200px] items-center justify-center">
      <div className="auth-orbit-1 absolute h-[200px] w-[200px] rounded-full border border-dashed border-[rgba(251,250,248,0.2)]" />
      <div className="auth-orbit-2 absolute h-[140px] w-[140px] rounded-full border border-[rgba(251,250,248,0.1)]" />
      <div className="auth-orbit-3 absolute h-[80px] w-[80px] rounded-full border border-dashed border-[rgba(251,250,248,0.1)]" />
      <div className="auth-orbit-4 absolute h-[30px] w-[30px] rounded-full border border-[rgba(185,140,242,0.5)]" />
    </div>
  );
}

/**
 * Split-screen shell for `/login` and `/signup` (client brief, 2026-09-03)
 * — brand panel left (45%), form right (55%), the Farfetch/Net-a-Porter
 * convention. Below `lg` the brand panel is hidden entirely and the form
 * goes full-width with the wordmark moved above it, per the brief's own
 * mobile note.
 *
 * A client component only because of the mount transition; everything else
 * here is static. The pages that render it stay server components.
 */
export function AuthSplitLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-var(--nav-h))]">
      <aside
        className="relative hidden w-[45%] shrink-0 flex-col items-center justify-center overflow-hidden px-10 py-16 lg:flex"
        style={{ background: PANEL_BACKGROUND }}
      >
        <Link href="/" aria-label="Levenon — home">
          <Wordmark logoColour="currentColor" className="h-8 w-auto text-paper" />
        </Link>

        <div className="mt-12">
          <OrbitDecoration />
        </div>

        <p className="mt-12 max-w-[240px] text-center font-mono text-[11px] italic text-[rgba(251,250,248,0.5)]">
          &ldquo;Unstitched. Yours to finish.&rdquo;
        </p>

        <ul className="absolute inset-x-0 bottom-10 flex items-center justify-center">
          {TRUST_BADGES.map((badge, index) => (
            <li
              key={badge}
              className={
                index === 0
                  ? "px-4 font-mono text-[10px] uppercase tracking-[0.15em] text-purple-300"
                  : "border-l border-[rgba(251,250,248,0.2)] px-4 font-mono text-[10px] uppercase tracking-[0.15em] text-purple-300"
              }
            >
              {badge}
            </li>
          ))}
        </ul>
      </aside>

      <m.div
        className="flex w-full flex-col justify-center px-6 py-16 sm:px-12 lg:w-[55%]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mx-auto w-full max-w-[380px]">
          {/* Mobile only — the brand panel that normally carries the mark is
              hidden below `lg`, so the form takes it over. */}
          <Link href="/" aria-label="Levenon — home" className="mb-10 inline-block lg:hidden">
            <Wordmark className="text-[1.25rem]" />
          </Link>
          {children}
        </div>
      </m.div>
    </div>
  );
}
