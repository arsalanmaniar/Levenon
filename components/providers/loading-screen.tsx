"use client";

import { useLayoutEffect, useState } from "react";
import { m } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

const SESSION_KEY = "levenon-loading-screen-seen";

/**
 * First-load splash (client brief, 2026-08-25): the wordmark's ring drawing
 * itself, then handing off to the real page. ~1.8s total: 1s to draw the
 * ring, a 0.2s hold, then a 0.5s fade to reveal the page underneath.
 *
 * Three states, not two: `null` (undecided — renders nothing, both on the
 * server and for the one tick before the layout effect below runs), `true`
 * (this is a first visit this session and reduced motion is off — show it),
 * `false` (already seen this session, or reduced motion is on — never
 * construct the animation at all, matching this codebase's rule everywhere
 * else). The `null` state is what keeps a returning-this-session visitor
 * from ever seeing the loader flash on then instantly off — `useLayoutEffect`
 * decides it before the browser paints the first client frame. React warns
 * about `useLayoutEffect` running during SSR, but that warning is itself the
 * documented, harmless one ("does nothing on the server") and does not apply
 * once the component only ever mounts client-side, which is already true of
 * everything in this provider chain (`SmoothScroll`, `MotionProvider`, …).
 */
export function LoadingScreen() {
  const reducedMotion = usePrefersReducedMotion();
  const [shouldShow, setShouldShow] = useState<boolean | null>(null);
  const [ringDone, setRingDone] = useState(false);

  useLayoutEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(SESSION_KEY) === "1";
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // Private browsing / storage disabled — treat as "already seen" so a
      // reader is never stuck re-seeing a loader that can't remember it.
      seen = true;
    }
    setShouldShow(!seen && !reducedMotion);
  }, [reducedMotion]);

  if (!shouldShow) return null;

  return (
    <m.div
      aria-hidden="true"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-paper"
      initial={{ opacity: 1 }}
      animate={{ opacity: ringDone ? 0 : 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      onAnimationComplete={() => {
        if (ringDone) setShouldShow(false);
      }}
    >
      <div className="flex flex-col items-center gap-6">
        <svg viewBox="0 0 120 120" className="h-20 w-20 text-purple-500" fill="none">
          <m.circle
            cx="60"
            cy="60"
            r="38"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            pathLength={1}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            onAnimationComplete={() => setRingDone(true)}
          />
        </svg>
        <span
          role="img"
          aria-label="Levenon"
          style={{ aspectRatio: "462 / 83" }}
          className="wordmark-asset block h-[1.15em] w-auto text-[1.5rem]"
        />
      </div>
    </m.div>
  );
}
