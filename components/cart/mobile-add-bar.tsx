"use client";

import { formatPrice, isInStock, type Product } from "@/lib/types";

/**
 * The mobile sticky bar (Priority 8): pinned to the bottom of the viewport
 * on small screens, always visible without scrolling, so the purchase path
 * never disappears off the bottom of a tall PDP.
 *
 * It does not duplicate `AddToCart`'s own size/quantity state — that state
 * lives in one place, the real size picker, and this bar's job is to get a
 * reader there in one tap rather than re-implement the same add-to-bag flow
 * twice. A plain in-page anchor scroll does that without a second source of
 * truth for what's selected.
 */
export function MobileAddBar({ product }: { product: Product }) {
  const inStock = isInStock(product);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-paper/95 backdrop-blur-md lg:hidden">
      <div className="mx-auto flex max-w-shell items-center justify-between gap-4 px-6 py-3">
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-bold tracking-[-0.01em]">
            {product.name}
          </p>
          <p className="font-mono text-sm font-medium text-purple-500">
            {formatPrice(product)}
          </p>
        </div>
        <a
          href="#add-to-cart"
          className="label inline-flex min-h-[48px] shrink-0 items-center justify-center rounded-full bg-ink px-6 text-paper transition-colors duration-200 ease-state hover:bg-purple-700"
        >
          {inStock ? "Add to bag" : "Join waitlist"}
        </a>
      </div>
    </div>
  );
}
