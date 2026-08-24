"use client";

import { useEffect } from "react";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { registerLenis } from "@/lib/scroll-lock";

/**
 * Lenis smooth scroll.
 *
 * `autoRaf: true` is passed explicitly below — it is NOT Lenis's default.
 * Checked directly against the installed package (1.3.26):
 * `node_modules/lenis/dist/lenis.mjs`'s constructor destructures
 * `autoRaf = false`. A previous version of this comment claimed the opposite
 * and the constructor never set it, so Lenis was being built and immediately
 * attaching its wheel/touch listeners (which take over scrolling to smooth
 * it) without ever calling its own `raf()` to advance that smoothed position.
 * The effect: wheel and trackpad input was captured and produced no motion —
 * every frame's target scroll position was computed and never applied —
 * while dragging the native scrollbar still worked, because that path writes
 * `scrollTop` directly rather than going through Lenis's interception. That
 * split (scrollbar works, wheel/trackpad don't) is the exact symptom this
 * fixes.
 *
 * It used to be wired to GSAP's ticker so Lenis and ScrollTrigger shared one
 * clock — but ScrollTrigger is gone: the only thing that used it, the stitch
 * divider, is now a native CSS scroll-driven animation. Keeping GSAP alive
 * purely to own a RAF loop cost a 542 ms long task on the home page for
 * nothing. `autoRaf: true` is the equivalent one-line replacement for that
 * loop — Lenis schedules and reschedules its own `requestAnimationFrame`
 * internally — rather than this file owning a second, hand-written loop.
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
        // frames and fights the platform. Left as-is deliberately: the
        // reported bug (wheel/trackpad dead, only the scrollbar worked) was
        // the missing `autoRaf` below, not this — a trackpad in a desktop
        // browser fires `wheel` events, which `smoothWheel` already governs;
        // `syncTouch` only affects touchscreen drag-scrolling, a different
        // input path this bug never touched.
        syncTouch: false,
        // See the file-level comment: this is NOT Lenis's default (it
        // defaults to false) and its absence was the actual bug.
        autoRaf: true,
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
