"use client";

import { useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { cn } from "@/lib/cn";
import { compareSizes, isInStock, type Product } from "@/lib/types";

/**
 * Add to bag, straight from the wishlist.
 *
 * Reads the cart's public hook and nothing else — the cart owns its own state
 * and this does not reach into it. A garment is bought in a size, so a size is
 * still required here; the difference from the detail page is that only sizes
 * actually on the rail are offered, because this is a shortcut, not a browse.
 *
 * Sold-out pieces get a waitlist link rather than a disabled button that
 * explains nothing.
 */
export function WishlistAddToCart({ product }: { product: Product }) {
  const { addVariant } = useCart();
  const [selected, setSelected] = useState<string | null>(null);

  const available = product.variants
    .filter((variant) => variant.stockOnHand > 0)
    .sort((a, b) => compareSizes(a.size, b.size));

  if (!isInStock(product)) {
    return (
      <a
        href="/stockists"
        className="label inline-flex min-h-[44px] items-center rounded-full border border-hairline px-5 text-ink transition-colors duration-200 ease-state hover:border-purple-500 hover:text-purple-500"
      >
        Join the waitlist
      </a>
    );
  }

  // One size on the rail: no picker, one action.
  const only = available.length === 1 ? available[0] : null;
  const variant = only ?? available.find((v) => v.sku === selected) ?? null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!only && (
        <ul className="flex flex-wrap gap-1.5" aria-label={`Sizes for ${product.name}`}>
          {available.map((option) => {
            const active = option.sku === selected;
            return (
              <li key={option.sku}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelected(option.sku)}
                  className={cn(
                    "label min-h-[36px] rounded-full border px-3 transition-colors duration-200 ease-state",
                    active
                      ? "border-purple-500 bg-purple-500 text-paper"
                      : "border-hairline text-ink hover:border-purple-500 hover:text-purple-500",
                  )}
                >
                  {option.size}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        disabled={!variant}
        onClick={() => variant && addVariant(product, variant)}
        className="label inline-flex min-h-[44px] items-center rounded-full bg-ink px-5 text-paper transition-colors duration-200 ease-state hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-charcoal/30"
      >
        {variant ? "Add to bag" : "Pick a size"}
      </button>
    </div>
  );
}
