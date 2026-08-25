"use client";

import { useEffect, useRef, useState } from "react";
import { m, useScroll, useTransform } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

// Same brand entrance easing as `Reveal` (expo-out) — kept as a literal copy
// rather than a shared import, since this is the one place a `clipPath`
// transform uses it instead of opacity/y.
const EASE = [0.16, 1, 0.3, 1] as const;

const HIDDEN = { clipPath: "inset(100% 0 0 0)" };
const SHOWN = { clipPath: "inset(0% 0 0 0)" };

/**
 * The atelier's abstract fabric-fold composition (client brief, 2026-08-26,
 * replacing the real photograph from the previous pass) — an SVG of
 * overlapping cloth folds in purple-700/purple-500, with the thread motif
 * (thin dashed lines, SKILL.md §5 form 2) crossing them. No network bytes,
 * unlike a photo — it inlines with the component.
 *
 * Everything below `AtelierAbstractContent` is identical in structure to the
 * previous pass's `AtelierImageReveal`: the same plain/onScroll clip-reveal
 * split, the same element-relative scroll parallax, the same hover-scale
 * layer on its own transform so it doesn't fight the parallax `y`. Only the
 * innermost content changed from a `next/image` photo to this SVG, so the
 * fade-in and scroll parallax the brief asks to keep are untouched.
 */
export function AtelierAbstract() {
  const reducedMotion = usePrefersReducedMotion();
  const [mode, setMode] = useState<"plain" | "onScroll">("plain");
  const probeRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: probeRef,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [-40, 40]);

  useEffect(() => {
    if (reducedMotion) {
      setMode("plain");
      return;
    }
    const rect = probeRef.current?.getBoundingClientRect();
    const onScreen = !rect || rect.top < window.innerHeight * 0.9;
    if (onScreen) return;
    setMode("onScroll");
  }, [reducedMotion]);

  return (
    <div ref={probeRef} className="relative h-full w-full overflow-hidden bg-ink">
      <m.div
        className="absolute inset-0"
        initial={mode === "onScroll" ? HIDDEN : false}
        whileInView={mode === "onScroll" ? SHOWN : undefined}
        viewport={{ once: true, margin: "0px 0px -12% 0px" }}
        transition={{ duration: 0.8, ease: EASE }}
        style={mode === "plain" ? SHOWN : undefined}
      >
        {/* Parallax layer — oversized so the vertical drift never exposes an
            edge. Hover scale lives one level deeper so the two transforms
            don't fight over the same element. */}
        <m.div
          className="absolute -inset-y-[8%] inset-x-0"
          style={reducedMotion ? undefined : { y }}
        >
          <div className="group/atelier h-full w-full">
            <div className="h-full w-full transition-transform duration-500 ease-out group-hover/atelier:scale-[1.04]">
              <FabricFolds />
            </div>
          </div>
        </m.div>
      </m.div>
    </div>
  );
}

/**
 * Overlapping cloth folds — four soft ribbon shapes on a purple-700→purple-500
 * gradient, each a cubic-bezier "S" curve rather than a straight band, so it
 * reads as cloth settling rather than a geometric stripe. Three dashed
 * threads (SKILL.md §5 form 2, the stitch line) cross them at an angle,
 * echoing the section's own stitch divider beside it.
 */
function FabricFolds() {
  return (
    <svg
      viewBox="0 0 400 500"
      preserveAspectRatio="xMidYMid slice"
      className="h-full w-full"
      aria-hidden="true"
    >
      <defs>
        {/* Plain CSS custom properties, not a Tailwind `theme()` arbitrary
            value — `theme()` would inline the raw
            `rgb(var(--purple-700-rgb) / <alpha-value>)` template with its
            `<alpha-value>` placeholder unresolved, which is not valid CSS
            outside Tailwind's own utility generation. `--purple-700` is the
            same token's plain hex form (SKILL.md §2), safe to reference
            directly in an inline style. */}
        <linearGradient id="fold-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" style={{ stopColor: "var(--purple-700)" }} />
          <stop offset="100%" style={{ stopColor: "var(--purple-500)" }} />
        </linearGradient>
        <linearGradient id="fold-b" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: "var(--purple-500)" }} />
          <stop offset="100%" style={{ stopColor: "var(--purple-700)" }} />
        </linearGradient>
      </defs>

      {/* Four overlapping folds, back to front. */}
      <path
        d="M-40 90 C 90 20, 190 170, 440 100 L 440 220 C 210 300, 80 150, -40 230 Z"
        fill="url(#fold-a)"
        opacity="0.55"
      />
      <path
        d="M-40 210 C 110 150, 210 320, 440 240 L 440 340 C 230 420, 90 270, -40 340 Z"
        fill="url(#fold-b)"
        opacity="0.7"
      />
      <path
        d="M-40 320 C 100 260, 230 430, 440 350 L 440 460 C 220 530, 70 380, -40 450 Z"
        fill="url(#fold-a)"
        opacity="0.85"
      />
      <path
        d="M-40 420 C 120 370, 260 520, 440 440 L 440 540 C 210 600, 60 470, -40 540 Z"
        fill="url(#fold-b)"
      />

      {/* Thread lines — the stitch motif crossing the folds, purple-300, dashed. */}
      <path
        d="M-20 60 C 140 140, 260 60, 420 160"
        className="stroke-purple-300"
        strokeWidth="1"
        strokeDasharray="6 8"
        strokeOpacity="0.5"
        fill="none"
      />
      <path
        d="M-20 240 C 140 320, 260 240, 420 340"
        className="stroke-purple-300"
        strokeWidth="1"
        strokeDasharray="6 8"
        strokeOpacity="0.4"
        fill="none"
      />
      <path
        d="M-20 420 C 140 500, 260 420, 420 480"
        className="stroke-purple-300"
        strokeWidth="1"
        strokeDasharray="6 8"
        strokeOpacity="0.35"
        fill="none"
      />
    </svg>
  );
}
