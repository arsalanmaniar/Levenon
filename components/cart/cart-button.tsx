"use client";

import { ShoppingBag } from "lucide-react";
import { useCart } from "./cart-provider";

/**
 * Nav bag control. The count is the ring from the wordmark with a number in it —
 * the same shape the nav already used, now carrying real state.
 */
export function CartButton() {
  const { totals, openCart } = useCart();

  return (
    <button
      type="button"
      onClick={openCart}
      // Same compact-below-`sm` treatment as WishlistButton, and for the same
      // reason — see the comment there.
      className="label inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 text-ink transition-colors duration-200 ease-state hover:text-purple-500 sm:min-w-0 sm:justify-start"
    >
      {/* Same sm..lg hide as SearchBar's icon — see the comment there. */}
      <ShoppingBag aria-hidden="true" strokeWidth={1.5} className="block h-5 w-5 sm:hidden lg:block" />
      <span className="hidden sm:inline">Bag</span>
      <span
        aria-hidden="true"
        className={
          totals.itemCount > 0
            ? "grid h-5 w-5 place-items-center rounded-full border border-purple-500 text-[10px] leading-none text-purple-500"
            : "grid h-5 w-5 place-items-center rounded-full border border-hairline text-[10px] leading-none"
        }
      >
        {totals.itemCount}
      </span>
      <span className="sr-only">
        {totals.itemCount === 1
          ? "1 piece in bag"
          : `${totals.itemCount} pieces in bag`}
      </span>
    </button>
  );
}
