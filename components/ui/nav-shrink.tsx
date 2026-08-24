"use client";

import { m, useScroll, useSpring, useTransform } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

/**
 * The nav's own density cue on scroll — the wordmark itself scales down
 * slightly rather than the bar's fixed height changing.
 *
 * `--nav-h` (72px) is load-bearing everywhere: `scroll-mt-[var(--nav-h)]` on
 * every anchor target, `min-h-[calc(100vh-var(--nav-h))]` on the hero. Making
 * the bar's actual height track scroll would ripple every one of those
 * calculations for a cosmetic effect. Scaling the wordmark instead delivers
 * the same "the nav just got more compact" read — a scale from 1 to ~0.82
 * reads as roughly the 28px→16px padding change asked for — without moving
 * a single pixel any other element's layout depends on.
 */
export function NavShrink({ children }: { children: React.ReactNode }) {
  const reducedMotion = usePrefersReducedMotion();
  const { scrollY } = useScroll();
  const rawScale = useTransform(scrollY, [0, 80], [1, 0.82]);
  // Reduced motion: no continuous scroll-tracked transform at all — the
  // wordmark stays at its resting scale, full stop, rather than a spring
  // that still (very gently) moves.
  const scale = useSpring(rawScale, { stiffness: 300, damping: 30 });

  return (
    <m.span
      style={reducedMotion ? undefined : { scale }}
      className="inline-flex origin-left"
    >
      {children}
    </m.span>
  );
}
