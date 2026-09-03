"use client";

import Link from "next/link";
import { m } from "framer-motion";
import type { ReactNode } from "react";
import { Wordmark } from "@/components/ui/wordmark";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

/** Always-dark panel, so literal hex rather than the theme-swapping `--ink`/`--paper` tokens — the same rule the hero and footer already follow. */
const PANEL_BACKGROUND = "linear-gradient(135deg, #1A0535 0%, #0B0B0D 70%)";
const PAPER = "#FBFAF8";
const PURPLE_300 = "#B98CF2";
const PANEL_EASE = [0.25, 0.1, 0, 1] as const;

const TRUST_BADGES = ["48 Pieces", "6 Fabrics", "Free Returns"];

/**
 * Three dashed rings, each drawing itself in on load and then turning at
 * its own rate. `r` is chosen so each ring's circumference is what the
 * `strokeDashoffset` animation counts down from.
 *
 * **`strokeDashoffset`, not Framer's `pathLength`.** `pathLength` is the
 * more idiomatic way to draw an SVG stroke, but it works by writing
 * `strokeDasharray`/`strokeDashoffset` itself — so it cannot coexist with a
 * decorative dash pattern, which is the whole look here. Animating the
 * offset directly against a fixed dash pattern draws the ring in *and*
 * keeps the dashes, which is the brief's own stated alternative.
 */
const RINGS = [
  { r: 96, dash: "8 6", opacity: 0.15, duration: 1.2, spin: "auth-orbit-outer" },
  { r: 68, dash: "4 8", opacity: 0.2, duration: 1.5, spin: "auth-orbit-middle" },
  { r: 40, dash: "12 4", opacity: 0.25, duration: 0.9, spin: "auth-orbit-inner" },
] as const;

/**
 * Six drifting dots. Positions, durations and delays are all hardcoded
 * rather than randomised: `Math.random()` in render would produce different
 * values on the server and the client and trip a hydration mismatch, and
 * would also make the composition different on every load — this reads as
 * scattered without actually being non-deterministic.
 */
const PARTICLES = [
  { left: "18%", top: "22%", duration: 3.4, delay: 0 },
  { left: "78%", top: "30%", duration: 4.6, delay: 0.6 },
  { left: "30%", top: "72%", duration: 3.9, delay: 1.2 },
  { left: "68%", top: "78%", duration: 5, delay: 0.3 },
  { left: "88%", top: "56%", duration: 4.2, delay: 1.6 },
  { left: "8%", top: "52%", duration: 3.6, delay: 0.9 },
] as const;

function OrbitDecoration({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div aria-hidden="true" className="relative h-[220px] w-[220px]">
      {RINGS.map((ring) => {
        const circumference = 2 * Math.PI * ring.r;
        return (
          <div
            key={ring.r}
            className={reducedMotion ? "absolute inset-0" : `absolute inset-0 ${ring.spin}`}
          >
            <svg viewBox="0 0 220 220" className="h-full w-full">
              <m.circle
                cx="110"
                cy="110"
                r={ring.r}
                fill="none"
                stroke={PAPER}
                strokeWidth="1"
                strokeOpacity={ring.opacity}
                strokeDasharray={ring.dash}
                initial={reducedMotion ? false : { strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: 0 }}
                transition={{ duration: reducedMotion ? 0 : ring.duration, ease: "easeOut" }}
              />
            </svg>
          </div>
        );
      })}

      {PARTICLES.map((particle) => (
        <m.span
          key={`${particle.left}-${particle.top}`}
          className="absolute h-1 w-1 rounded-full"
          style={{ left: particle.left, top: particle.top, backgroundColor: `${PURPLE_300}66` }}
          animate={reducedMotion ? undefined : { y: [0, -15, 0] }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/**
 * Split-screen shell for `/login` and `/signup` — brand panel left (45%),
 * form right (55%), the Farfetch/Net-a-Porter convention. Below `lg` the
 * brand panel is hidden entirely and the form goes full-width with the
 * wordmark moved above it.
 *
 * The two panels enter from opposite edges (client brief, 2026-09-03),
 * which is also why this is a client component; the pages that render it
 * stay server components, and the form's own staggered entrance is timed
 * to start after these (see `authFieldTransition` in `auth-field.tsx`).
 */
export function AuthSplitLayout({ children }: { children: ReactNode }) {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div className="flex min-h-[calc(100vh-var(--nav-h))]">
      <m.aside
        className="relative hidden w-[45%] shrink-0 flex-col items-center justify-center overflow-hidden px-10 py-16 lg:flex"
        style={{ background: PANEL_BACKGROUND }}
        initial={reducedMotion ? false : { x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: reducedMotion ? 0 : 0.6, ease: PANEL_EASE }}
      >
        <Link href="/" aria-label="Levenon — home">
          <Wordmark logoColour="currentColor" className="h-8 w-auto text-paper" />
        </Link>

        <div className="mt-12">
          <OrbitDecoration reducedMotion={reducedMotion} />
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
      </m.aside>

      <m.div
        className="flex w-full flex-col justify-center px-6 py-16 sm:px-12 lg:w-[55%]"
        initial={reducedMotion ? false : { x: 60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: reducedMotion ? 0 : 0.6, delay: reducedMotion ? 0 : 0.1, ease: PANEL_EASE }}
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
