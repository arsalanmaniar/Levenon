"use client";

import { LazyMotion, domAnimation } from "framer-motion";

/**
 * The animation feature bundle, mounted once for the whole app.
 *
 * Every animated component here imports `m`, not `motion`. `m` is the same
 * component with none of the features compiled in; the features arrive through
 * this provider. That keeps `drag`, `layout`/`layoutId` and the projection
 * engine — none of which this site uses — out of first-load JS.
 *
 * `domAnimation` is imported **statically**, not as `() => import(...)`. The
 * async form defers the bundle to a second chunk, and the first thing that
 * animates on this site is usually the cart drawer: with an async bundle its
 * opening frame paints unanimated while the chunk is still in flight, and the
 * panel snaps into place instead of sliding.
 *
 * `strict` makes the mistake loud — a stray `motion.*` anywhere throws at
 * runtime rather than quietly pulling the full bundle back in. The ESLint rule
 * in .eslintrc.json catches it earlier still.
 *
 * This sits in its own client module rather than inline in app/layout.tsx so
 * the feature bundle is imported from inside client-land, where it tree-shakes
 * normally, instead of crossing the server/client boundary as a prop.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
