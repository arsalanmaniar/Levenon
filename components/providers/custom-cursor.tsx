"use client";

import { useEffect } from "react";
import { m, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useMediaQuery } from "@/hooks/use-media-query";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

const DOT_SIZE = 8;
const RING_SIZE = 36;
const RING_HOVER_SIZE = 60;
const RING_SPRING = { stiffness: 300, damping: 30, mass: 0.5 } as const;
const SCALE_SPRING = { stiffness: 300, damping: 26 } as const;

// Anything a reader would meaningfully click or type into. Broad on
// purpose — annotating every interactive element sitewide with a data
// attribute wasn't worth it when `a`/`button`/form controls already cover
// the near-totality of this site's interactive surface.
const HOVER_SELECTOR = "a, button, [role='button'], input, textarea, select, summary";

/**
 * Custom cursor (user request, 2026-08-31) — a small solid dot tracking the
 * pointer exactly, with a larger hollow ring trailing slightly behind it on
 * a spring, growing over links/buttons/images. Purple-500, the brand's own
 * accent — SKILL.md §2 already permits it at ring/focus-outline contrast
 * (3:1, not 4.5:1), which is exactly what a cursor ring is.
 *
 * Gated to `pointer: fine` and off entirely under reduced motion — a
 * pointer that visibly trails the real one is motion, not decoration, for
 * exactly the reader §7 already exempts from every other animation on this
 * site. Both values are read from the same shared media-query store
 * `product-card.tsx`'s tilt and `spotlight-surface.tsx`'s glow already use,
 * so this adds no new `matchMedia` subscription.
 *
 * Position is tracked via `useMotionValue`/`useTransform`, not React state —
 * a `pointermove` firing on every animation frame must never trigger a
 * render, the same reasoning `product-card.tsx`'s own tilt spring uses.
 */
export function CustomCursor() {
  const finePointer = useMediaQuery("(pointer: fine)");
  const reducedMotion = usePrefersReducedMotion();
  const enabled = finePointer && !reducedMotion;

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const ringFollowX = useSpring(cursorX, RING_SPRING);
  const ringFollowY = useSpring(cursorY, RING_SPRING);
  const hoverScale = useMotionValue(1);
  const ringScale = useSpring(hoverScale, SCALE_SPRING);

  const dotX = useTransform(cursorX, (value) => value - DOT_SIZE / 2);
  const dotY = useTransform(cursorY, (value) => value - DOT_SIZE / 2);
  const ringX = useTransform(ringFollowX, (value) => value - RING_SIZE / 2);
  const ringY = useTransform(ringFollowY, (value) => value - RING_SIZE / 2);

  useEffect(() => {
    if (!enabled) return;

    const onMove = (event: PointerEvent) => {
      cursorX.set(event.clientX);
      cursorY.set(event.clientY);
    };
    const onOver = (event: PointerEvent) => {
      const hovering = (event.target as Element | null)?.closest(HOVER_SELECTOR);
      hoverScale.set(hovering ? RING_HOVER_SIZE / RING_SIZE : 1);
    };

    document.documentElement.classList.add("custom-cursor-active");
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });

    return () => {
      document.documentElement.classList.remove("custom-cursor-active");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
    };
  }, [enabled, cursorX, cursorY, hoverScale]);

  if (!enabled) return null;

  return (
    <>
      <m.div
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[300] rounded-full bg-purple-500"
        style={{ x: dotX, y: dotY, width: DOT_SIZE, height: DOT_SIZE }}
      />
      <m.div
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[300] rounded-full border border-purple-500"
        style={{
          x: ringX,
          y: ringY,
          width: RING_SIZE,
          height: RING_SIZE,
          scale: ringScale,
        }}
      />
    </>
  );
}
