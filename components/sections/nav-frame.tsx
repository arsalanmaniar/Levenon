"use client";

import { m, useScroll, useTransform } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

const BRAND_EASE = [0.16, 1, 0.3, 1] as const;

/**
 * The nav row's own animated shell (client brief, 2026-08-25).
 *
 * Two things live here rather than in `SiteNav` (which stays a server
 * component): the scroll-driven height shrink, and the on-mount entrance for
 * the logo and the icon cluster (`NavLinks` owns its own entrance, since it
 * already needs to be a client island for the scrollspy).
 *
 * **Deliberately does not touch `--nav-h`.** That token is a fixed 72px used
 * as a static offset everywhere else on the site (`scroll-mt-[var(--nav-h)]`
 * on every anchor target, the PDP's sticky gallery, the hero's min-height
 * calc) — recalculating it live would ripple through all of those for a
 * cosmetic effect. Instead this row is sized by padding, not a fixed height,
 * and the padding rests at a value (`py-24` ≈ the wordmark's own height)
 * that sums to very close to 72px — `--nav-h` stays exactly what it always
 * was: a safe, slightly generous upper bound for "how tall the nav ever is",
 * still correct even while the nav is visually shorter mid-scroll.
 */
export function NavFrame({
  logo,
  links,
  actions,
}: {
  logo: React.ReactNode;
  links: React.ReactNode;
  actions: React.ReactNode;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const { scrollY } = useScroll();
  // py: 24 → 14px, past 60px of scroll (client brief).
  const paddingY = useTransform(scrollY, [0, 60], [24, 14]);

  return (
    <m.nav
      aria-label="Primary"
      className="mx-auto flex max-w-shell items-center justify-between px-6 lg:px-10"
      style={
        reducedMotion
          ? { paddingTop: 24, paddingBottom: 24 }
          : { paddingTop: paddingY, paddingBottom: paddingY }
      }
    >
      <m.div
        className="flex items-center"
        initial={reducedMotion ? false : { x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: BRAND_EASE }}
      >
        {logo}
      </m.div>

      {links}

      {/* Icons fade in last — after the logo (0.5s) and the links' own
          stagger (4 × 0.08s ≈ 0.32s from their own 0-start). */}
      <m.div
        className="flex items-center gap-1 sm:gap-4 md:gap-3 lg:gap-6"
        initial={reducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.5, ease: BRAND_EASE }}
      >
        {actions}
      </m.div>
    </m.nav>
  );
}
