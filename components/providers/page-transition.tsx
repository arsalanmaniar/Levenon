"use client";

import { AnimatePresence, m } from "framer-motion";
import { usePathname } from "next/navigation";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

// Same brand entrance easing as `Reveal` (expo-out).
const EASE = [0.16, 1, 0.3, 1] as const;

const VARIANTS = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: EASE } },
};

/**
 * Page transition wrapper (client brief, 2026-08-24), applied to the root
 * layout's `children`.
 *
 * The App Router doesn't remount `children` on every navigation by itself —
 * `AnimatePresence` only runs its exit/enter dance when the element it's
 * watching actually changes identity, which is what `key={pathname}` supplies
 * here.
 *
 * Under reduced motion this renders `children` directly: no `AnimatePresence`,
 * no `m.div`, nothing constructed — the same rule every other motion
 * primitive on this site follows.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reducedMotion = usePrefersReducedMotion();

  if (reducedMotion) return <>{children}</>;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div key={pathname} initial="initial" animate="animate" exit="exit" variants={VARIANTS}>
        {children}
      </m.div>
    </AnimatePresence>
  );
}
