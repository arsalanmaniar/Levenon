"use client";

import { useMotionValue, useSpring, type MotionStyle } from "framer-motion";
import { useMediaQuery } from "@/hooks/use-media-query";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

const MAGNETIC_SPRING = { stiffness: 200, damping: 15, mass: 0.3 } as const;
/** Max pull, in px, each axis — a subtle nudge toward the pointer, not a chase. */
const MAX_PULL = 4;

/**
 * Magnetic hover (recommendation, 2026-08-31) — a primary CTA nudges up to
 * `MAX_PULL`px toward the pointer inside its own box, springing back on
 * leave. Shared by `ShimmerButton`/`ThreadButton` rather than duplicated —
 * both are this site's only two button shapes, and a magnetic pull on one
 * but not the other would read as inconsistent rather than as a considered
 * touch.
 *
 * Gated to a fine pointer and off entirely under reduced motion, the same
 * shared-media-query pattern `product-card.tsx`'s own tilt and
 * `custom-cursor.tsx` already use. Disabled, `style`/handlers are both
 * empty — the caller's own `whileHover`/`whileTap` still apply on top, `x`/
 * `y` motion values and Framer's `scale` animation compose into one
 * `transform` regardless of which one set which axis.
 */
export function useMagneticHover(): {
  style: MotionStyle | undefined;
  handlers: {
    onMouseMove?: (event: React.MouseEvent<HTMLElement>) => void;
    onMouseLeave?: () => void;
  };
} {
  const finePointer = useMediaQuery("(pointer: fine)");
  const reducedMotion = usePrefersReducedMotion();
  const enabled = finePointer && !reducedMotion;

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, MAGNETIC_SPRING);
  const y = useSpring(rawY, MAGNETIC_SPRING);

  if (!enabled) return { style: undefined, handlers: {} };

  return {
    style: { x, y },
    handlers: {
      onMouseMove: (event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        rawX.set(((event.clientX - rect.left) / rect.width - 0.5) * MAX_PULL * 2);
        rawY.set(((event.clientY - rect.top) / rect.height - 0.5) * MAX_PULL * 2);
      },
      onMouseLeave: () => {
        rawX.set(0);
        rawY.set(0);
      },
    },
  };
}
