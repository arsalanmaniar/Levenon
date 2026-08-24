"use client";

import { useWishlist } from "./wishlist-provider";
import { cn } from "@/lib/cn";
import type { Product } from "@/lib/types";

/**
 * Save toggle, used on cards and on the detail page.
 *
 * Both read the same provider, so the two stay in sync without any wiring at
 * the call sites. No pulse or scale animation: the brand does not bounce, and
 * the state change is carried by fill + colour, which reads instantly and costs
 * nothing under reduced motion.
 *
 * The heart is decorative; the button carries the label, and `aria-pressed`
 * carries the state rather than colour alone.
 */
export function WishlistHeart({
  product,
  className,
  /** `card` sits over the tile; `inline` sits in a row of controls. */
  variant = "card",
}: {
  product: Product;
  className?: string;
  variant?: "card" | "inline";
}) {
  const { has, toggle } = useWishlist();
  const saved = has(product.id);

  return (
    <button
      type="button"
      aria-pressed={saved}
      onClick={(event) => {
        // Cards wrap their content in a link — saving must not navigate.
        event.preventDefault();
        event.stopPropagation();
        toggle(product);
      }}
      className={cn(
        "inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full transition-colors duration-200 ease-state",
        // Solid `bg-paper` rather than `bg-paper/90 backdrop-blur-sm`: this
        // control renders once per product tile, so the blur was a
        // compositor-sampled backdrop on every card in the grid. Profiling a
        // phone put Style & Layout at 1413 ms; opaque paper over the
        // photograph reads the same at 44px and costs nothing.
        variant === "card" &&
          "border border-hairline bg-paper hover:border-purple-500",
        variant === "inline" && "border border-hairline hover:border-purple-500",
        saved ? "text-purple-500" : "text-charcoal hover:text-purple-500",
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-[18px] w-[18px]"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path
          d="M12 20.5 4.2 12.9a4.8 4.8 0 0 1 0-6.8 4.8 4.8 0 0 1 6.8 0l1 1 1-1a4.8 4.8 0 0 1 6.8 0 4.8 4.8 0 0 1 0 6.8Z"
          strokeLinejoin="round"
        />
      </svg>
      <span className="sr-only">
        {saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
      </span>
    </button>
  );
}
