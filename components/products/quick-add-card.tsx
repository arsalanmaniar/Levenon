"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { WishlistHeart } from "@/components/wishlist/wishlist-heart";
import {
  FEATURED_LEAD_IMAGE_SIZES,
  FEATURED_SIDE_IMAGE_SIZES,
  ProductMedia,
} from "./product-media";
import { cn } from "@/lib/cn";
import { allSizes, formatPrice, isInStock, type Product } from "@/lib/types";

/**
 * A featured-rail card with quick add — the one place on the site a shopper
 * can put a piece in the bag without leaving the page they're on.
 *
 * The size picker is inline, not a second modal: it swaps in over the
 * "Quick add" trigger, in the same footprint, so nothing about the card's
 * layout shifts and no second surface has to be built. Genuinely out-of-
 * stock pieces skip straight to a "Join the waitlist" link to the PDP —
 * there is nothing to quick-add.
 *
 * `large` widens the image aspect and bumps the name/price size for the
 * featured slot; the three side cards use the compact form.
 */
export function QuickAddCard({
  product,
  large = false,
  priority = false,
}: {
  product: Product;
  large?: boolean;
  priority?: boolean;
}) {
  const { addVariant } = useCart();
  const [picking, setPicking] = useState(false);
  const sizes = allSizes(product);
  const inStock = isInStock(product);

  const handleQuickAdd = (size: (typeof sizes)[number]) => {
    const variant = product.variants.find((candidate) => candidate.size === size);
    if (!variant || variant.stockOnHand === 0) return;
    addVariant(product, variant);
    setPicking(false);
  };

  return (
    <article className="group relative">
      <Link
        href={`/product/${product.slug}`}
        className="block focus-visible:outline-offset-4"
        aria-label={`${product.name} — ${formatPrice(product)}`}
      >
        <div
          className={cn(
            // `isolate` is load-bearing, not decoration: the hover-swap
            // second image is a `-z-10` child, and without a stacking
            // context here it would paint behind this element's own
            // `bg-paper` background and never be seen.
            "relative isolate overflow-hidden border border-hairline bg-paper transition-colors duration-300 ease-state group-hover:border-purple-500/40",
            large ? "aspect-[3/4]" : "aspect-[4/3]",
          )}
        >
          <ProductMedia
            product={product}
            sizes={large ? FEATURED_LEAD_IMAGE_SIZES : FEATURED_SIDE_IMAGE_SIZES}
            priority={priority}
            hoverSwap
          />

          {/* Quieted to match the standard product card (2026-08-24): a
              solid purple fill on a badge every tile carries reads as
              decoration, not accent — purple is reserved for hover/active
              states elsewhere on this card (the border, the quick-add
              hover fill below). */}
          {/* Solid tint rather than `backdrop-blur` — see the note on the same
              badge in `product-card.tsx` for the profiling behind it. */}
          <span className="label absolute left-4 top-4 bg-paper/90 px-2.5 py-1 text-charcoal">
            {product.category.name}
          </span>

          <WishlistHeart product={product} className="absolute right-4 top-4" />
        </div>

        {/* Same stack-then-row treatment as `ProductCard` — see the overflow
            note there for the measurement behind it. */}
        <div className="mt-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
          <h3
            className={cn(
              "font-display font-bold tracking-[-0.02em]",
              large ? "text-xl" : "text-base",
            )}
          >
            {product.name}
          </h3>
          <span className="font-mono text-sm font-medium tracking-tight text-ink sm:whitespace-nowrap">
            {formatPrice(product)}
          </span>
        </div>

        {/*
          Editorial metadata line: what the cloth actually is, which on an
          unstitched-suit rail is the single fact a shopper sorts by. Read
          off the `specs` rows rather than hardcoded — falls back to the
          category name when a row has no "Shirt" spec, so this never
          renders an empty line.
        */}
        <p className="label mt-2 text-charcoal">
          {product.specs.find((spec) => spec.label === "Shirt")?.value ??
            product.category.name}
        </p>

        {/* Lead piece only: one line of real copy at reading size. Kept out
            of the `label` above deliberately — a full sentence set in
            uppercase mono at 0.18em tracking is unreadable. */}
        {large && product.blurb ? (
          <p className="mt-3 max-w-[52ch] text-sm leading-relaxed text-charcoal">
            {product.blurb}
          </p>
        ) : null}
      </Link>

      {/*
        The quick-add control sits outside the <Link> — same reason
        `WishlistHeart` does on the standard card — so opening the size
        picker or adding to the bag never triggers navigation.
      */}
      {inStock && (
        <div
          className={cn(
            "mt-3 opacity-100 transition-opacity duration-200 ease-state",
            // Hover-reveal only where hover is a real signal; always present
            // below `lg` so touch devices get the same affordance without a
            // hover state that can never fire for them.
            "lg:pointer-events-none lg:opacity-0 lg:group-hover:pointer-events-auto lg:group-hover:opacity-100",
          )}
        >
          {picking ? (
            <div className="flex flex-wrap items-center gap-2 border border-hairline bg-paper p-2">
              {sizes.map((size) => {
                const variant = product.variants.find((candidate) => candidate.size === size);
                const available = (variant?.stockOnHand ?? 0) > 0;
                return (
                  <button
                    key={size}
                    type="button"
                    disabled={!available}
                    onClick={() => handleQuickAdd(size)}
                    className={cn(
                      "label rounded-full border px-3 py-1.5 transition-colors duration-200 ease-state",
                      available
                        ? "border-hairline text-ink hover:border-purple-500 hover:bg-purple-500 hover:text-paper"
                        : "cursor-not-allowed border-dashed border-hairline text-charcoal",
                    )}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => (sizes.length === 1 ? handleQuickAdd(sizes[0]) : setPicking(true))}
              className="label inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-ink px-6 text-paper transition-colors duration-200 ease-state hover:bg-purple-700"
            >
              Quick add
            </button>
          )}
        </div>
      )}
    </article>
  );
}
