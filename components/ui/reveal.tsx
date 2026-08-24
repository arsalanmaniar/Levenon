"use client";

import { useEffect, useRef, useState } from "react";
import { m } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

type RevealProps = {
  children: React.ReactNode;
  /** Seconds. Keep stagger tight — 0.06–0.1 between siblings. */
  delay?: number;
  className?: string;
  as?: "div" | "li" | "section" | "header" | "p";
  /**
   * `"up"` (default) is SKILL.md §7's standard reveal — a small translate-up
   * + fade, used everywhere. `"right"` is a scoped exception, requested
   * explicitly for the atelier's text column only (Priority 4): the offset
   * is kept small (24px) specifically so it still reads as "the same
   * reveal, from a different edge" rather than the off-screen slide §7 rules
   * out — see the atelier section for the one place this is used.
   */
  from?: "up" | "right";
};

// Brand entrance: rise 20px + fade, expo-out. Never scale, never blur.
const EASE = [0.16, 1, 0.3, 1] as const;
const HIDDEN_BY_DIRECTION = {
  up: { opacity: 0, y: 20 },
  right: { opacity: 0, x: 24 },
} as const;
const SHOWN_BY_DIRECTION = {
  up: { opacity: 1, y: 0 },
  right: { opacity: 1, x: 0 },
} as const;

type Mode = "plain" | "onScroll";

/**
 * Scroll-in reveal used by every section.
 *
 * Two modes:
 *   plain     — server render, hydration, reduced motion, **and anything
 *               already on screen when JS takes over**. No animation is built;
 *               the content is simply there.
 *   onScroll  — below the fold: the usual once-only whileInView reveal.
 *
 * Above-the-fold content is deliberately not animated. It has already painted
 * from the server HTML, so animating it means dropping it back to opacity 0 at
 * hydration and fading it in again — the reader watches the headline appear,
 * vanish, and return. It also delays LCP, since the largest element is the hero
 * h1. Content that has painted stays painted; reveals are for content the
 * reader scrolls to.
 *
 * Because the first client render is always `plain`, markup matches the server
 * and nothing is hidden if JS never arrives.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
  from = "up",
}: RevealProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [mode, setMode] = useState<Mode>("plain");
  const probeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (reducedMotion) {
      setMode("plain");
      return;
    }

    const rect = probeRef.current?.getBoundingClientRect();
    // No rect (shouldn't happen) → treat as on screen and leave it alone; the
    // failure mode of a missing animation beats content that flashes or hides.
    const onScreen = !rect || rect.top < window.innerHeight * 0.9;
    if (onScreen) return;
    setMode("onScroll");
  }, [reducedMotion]);

  if (mode === "plain") {
    const Plain = as;
    return (
      <Plain ref={probeRef as React.Ref<never>} className={className}>
        {children}
      </Plain>
    );
  }

  const Component = m[as];

  return (
    <Component
      className={className}
      initial={HIDDEN_BY_DIRECTION[from]}
      whileInView={SHOWN_BY_DIRECTION[from]}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.8, delay, ease: EASE }}
    >
      {children}
    </Component>
  );
}
