"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useWishlist } from "./wishlist-provider";

/**
 * Nav wishlist link with a live count, sitting alongside the cart badge.
 *
 * A link rather than a button: unlike the bag, the wishlist has a real page.
 */
export function WishlistButton() {
  const { count } = useWishlist();

  return (
    <Link
      href="/wishlist"
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
      <Heart aria-hidden="true" strokeWidth={1.5} className="block h-5 w-5 sm:hidden lg:block" />
      <span className="hidden sm:inline">Saved</span>
      <span
        aria-hidden="true"
        className={
          count > 0
            ? "grid h-5 w-5 place-items-center rounded-full border border-purple-500 text-[10px] leading-none text-purple-500"
            : "grid h-5 w-5 place-items-center rounded-full border border-hairline text-[10px] leading-none"
        }
      >
        {count}
      </span>
      <span className="sr-only">
        {count === 1 ? "1 piece saved" : `${count} pieces saved`}
      </span>
    </Link>
  );
}
