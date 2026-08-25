"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { m, useAnimationControls } from "framer-motion";
import { useWishlist } from "./wishlist-provider";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

/**
 * Nav wishlist link with a live count, sitting alongside the cart badge.
 *
 * A link rather than a button: unlike the bag, the wishlist has a real page.
 *
 * On a count increase (client brief, 2026-08-25): the heart glyph pulses
 * (scale 1→1.3→1) and the badge pops — same pattern as `CartButton`, watching
 * `count` rather than the toggle itself, so it fires regardless of which
 * card's heart was clicked.
 *
 * On hover (client brief, 2026-08-26): scale(1.2) plus a brief purple-300
 * fill — `flashFill` below is a plain timed state rather than a Framer
 * colour tween, since lucide's `Heart` isn't a motion component and
 * swapping a Tailwind class on a timer is the simpler way to get a fill
 * that flashes in and reverts *while the pointer is still hovering*, which
 * a CSS `:hover` rule alone cannot express.
 */
export function WishlistButton() {
  const { count } = useWishlist();
  const reducedMotion = usePrefersReducedMotion();
  const heartControls = useAnimationControls();
  const badgeControls = useAnimationControls();
  const previousCount = useRef(count);
  const [flashFill, setFlashFill] = useState(false);
  const flashTimer = useRef<number | null>(null);

  useEffect(() => {
    if (count > previousCount.current && !reducedMotion) {
      heartControls.start({ scale: [1, 1.3, 1], transition: { duration: 0.3 } });
      badgeControls.start({ scale: [1, 1.2, 1], transition: { duration: 0.3 } });
    }
    previousCount.current = count;
  }, [count, reducedMotion, heartControls, badgeControls]);

  useEffect(() => () => {
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
  }, []);

  return (
    <Link
      href="/wishlist"
      onPointerEnter={() => {
        if (reducedMotion) return;
        setFlashFill(true);
        if (flashTimer.current) window.clearTimeout(flashTimer.current);
        flashTimer.current = window.setTimeout(() => setFlashFill(false), 400);
      }}
      /*
       * Below `sm` this sits alongside four other nav controls (Shop, the
       * theme toggle, Search, Bag) in a row that measured 282px wide at
       * 320px with 177px actually available — a real overflow, caused by two
       * controls added in this same pass, not by this one. The word "Saved"
       * is the single largest item in that row; hiding it here and
       * restoring it from `sm:` (640px) recovers the room without losing
       * anything a screen reader announces — the `sr-only` span below
       * already carries the full count in words, and `min-w-[44px]`
       * keeps the same tap-target floor the rest of the nav uses.
       */
      className="label inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 text-ink transition-colors duration-200 ease-state hover:text-purple-500 sm:min-w-0 sm:justify-start"
    >
      {/* Same sm..lg hide as SearchBar's icon — see the comment there. */}
      <m.span
        animate={heartControls}
        whileHover={reducedMotion ? undefined : { scale: 1.2 }}
        transition={{ duration: 0.2 }}
        className={
          flashFill
            ? "block text-purple-300 transition-colors duration-200 sm:hidden lg:block"
            : "block transition-colors duration-200 sm:hidden lg:block"
        }
      >
        <Heart
          aria-hidden="true"
          size={18}
          strokeWidth={1.5}
          fill={flashFill ? "currentColor" : "none"}
        />
      </m.span>
      <span className="hidden sm:inline">Saved</span>
      <m.span
        animate={badgeControls}
        aria-hidden="true"
        className={
          count > 0
            ? "grid h-5 w-5 place-items-center rounded-full border border-purple-500 text-[clamp(0.5625rem,0.9vw,0.6875rem)] leading-none text-purple-500"
            : "grid h-5 w-5 place-items-center rounded-full border border-hairline text-[clamp(0.5625rem,0.9vw,0.6875rem)] leading-none"
        }
      >
        {count}
      </m.span>
      <span className="sr-only">
        {count === 1 ? "1 piece saved" : `${count} pieces saved`}
      </span>
    </Link>
  );
}
