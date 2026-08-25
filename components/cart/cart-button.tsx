"use client";

import { useEffect, useRef } from "react";
import { ShoppingBag } from "lucide-react";
import { m, useAnimationControls } from "framer-motion";
import { useCart } from "./cart-provider";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

/**
 * Nav bag control. The count is the ring from the wordmark with a number in it —
 * the same shape the nav already used, now carrying real state.
 *
 * On a count increase (client brief, 2026-08-25): the bag glyph bounces
 * (y: 0→-4→0) and the badge pops (scale 1→1.2→1) — a cue that lands in the
 * nav even when the add happened elsewhere (a quick-add card, the PDP).
 * Watches `itemCount` rather than wrapping `addVariant` itself, so every
 * add-to-cart entry point gets the same feedback for free.
 */
export function CartButton() {
  const { totals, openCart } = useCart();
  const reducedMotion = usePrefersReducedMotion();
  const bagControls = useAnimationControls();
  const badgeControls = useAnimationControls();
  const previousCount = useRef(totals.itemCount);

  useEffect(() => {
    if (totals.itemCount > previousCount.current && !reducedMotion) {
      bagControls.start({ y: [0, -4, 0], transition: { duration: 0.3 } });
      badgeControls.start({ scale: [1, 1.2, 1], transition: { duration: 0.3 } });
    }
    previousCount.current = totals.itemCount;
  }, [totals.itemCount, reducedMotion, bagControls, badgeControls]);

  return (
    <button
      type="button"
      onClick={openCart}
      // Same compact-below-`sm` treatment as WishlistButton, and for the same
      // reason — see the comment there.
      className="label inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 text-ink transition-colors duration-200 ease-state hover:text-purple-500 sm:min-w-0 sm:justify-start"
    >
      {/* Same sm..lg hide as SearchBar's icon — see the comment there. */}
      <m.span
        animate={bagControls}
        // Hover: scale(1.15) + a slight bounce (client brief, 2026-08-26) —
        // the `y` keyframe array plays once per hover-enter and settles back
        // at 0 while the hover continues, so it reads as a bounce rather
        // than a held offset.
        whileHover={reducedMotion ? undefined : { scale: 1.15, y: [0, -3, 0] }}
        transition={{ duration: 0.3 }}
        className="block sm:hidden lg:block"
      >
        <ShoppingBag aria-hidden="true" size={18} strokeWidth={1.5} />
      </m.span>
      <span className="hidden sm:inline">Bag</span>
      <m.span
        animate={badgeControls}
        aria-hidden="true"
        className={
          totals.itemCount > 0
            ? "grid h-5 w-5 place-items-center rounded-full border border-purple-500 text-[clamp(0.5625rem,0.9vw,0.6875rem)] leading-none text-purple-500"
            : "grid h-5 w-5 place-items-center rounded-full border border-hairline text-[clamp(0.5625rem,0.9vw,0.6875rem)] leading-none"
        }
      >
        {totals.itemCount}
      </m.span>
      <span className="sr-only">
        {totals.itemCount === 1
          ? "1 piece in bag"
          : `${totals.itemCount} pieces in bag`}
      </span>
    </button>
  );
}
