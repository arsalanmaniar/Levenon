"use client";

import { useEffect } from "react";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { registerLenis } from "@/lib/scroll-lock";

/**
 * Lenis smooth scroll.
 *
 * Lenis now drives its own RAF loop (`autoRaf`, its default). It used to be
 * wired to GSAP's ticker so Lenis and ScrollTrigger shared one clock — but
 * ScrollTrigger is gone: the only thing that used it, the stitch divider, is
 * now a native CSS scroll-driven animation. Keeping GSAP alive purely to own a
 * RAF loop cost a 542 ms long task on the home page for nothing.
 *
 * Renders nothing. Under reduced motion no Lenis instance is created at all and
 * the browser's native scrolling is left alone — including if the user flips
 * the preference mid-session, because the effect re-runs and tears down.
 *
 * Imported dynamically: no scroll library in the first-paint path.
 */
export function SmoothScroll() {
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      const { default: Lenis } = await import("lenis");
      if (cancelled) return;

      const lenis = new Lenis({
        duration: 1.1,
        // Expo-out: the brand easing, applied to the scroll itself.
        easing: (t: number) => 1 - Math.pow(1 - t, 4),
        smoothWheel: true,
        // Touch devices already have good native inertia; overriding it costs
        // frames and fights the platform.
        syncTouch: false,
      });

      // Published so modal surfaces (cart, filters, size guide) can stop and
      // restart the scroll they are covering. Nothing else may touch it.
      registerLenis(lenis);

      cleanup = () => {
        registerLenis(null);
        lenis.destroy();
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [reducedMotion]);

  return null;
}
