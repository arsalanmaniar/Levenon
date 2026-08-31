"use client";

import Link from "next/link";
import { useState } from "react";
import { m } from "framer-motion";
import { useCart } from "@/components/cart/cart-provider";
import { WishlistHeart } from "@/components/wishlist/wishlist-heart";
import { LowStockBadge } from "./low-stock-badge";
import { NEW_ARRIVALS_CARD_IMAGE_SIZES, ProductMedia } from "./product-media";
import { cn } from "@/lib/cn";
import { allSizes, formatPrice, isInStock, type Product } from "@/lib/types";

/**
 * One card in the New Arrivals horizontal carousel (client brief,
 * 2026-08-31 — the "Just landed" section's full redesign, Maria B/Sapphire
 * "Most Trending" style). Replaces `QuickAddCard`, which existed only for
 * the 1+3 editorial rail this carousel replaces and is deleted this pass —
 * `NewArrivalCard` is deliberately simpler: a fixed 3:4 tile, no "large"
 * variant, no editorial standfirst paragraph.
 *
 * "NEW" is unconditional here, not computed per-product — every card in
 * this carousel is, by construction, one of the catalogue's most recently
 * added rows (see `featured-products.tsx`), so there's no "is this one
 * actually new" question to answer per card the way the full grid has.
 *
 * The quick-add bar genuinely slides (`translate-y-full` → `translate-y-0`),
 * not just a fade — the brief's own "slides up from bottom," distinct from
 * `ProductCard`'s opacity-only reveal for the standard grid tile.
 */
export function NewArrivalCard({
  product,
  index,
  priority = false,
}: {
  product: Product;
  index: number;
  priority?: boolean;
}) {
  const { addVariant } = useCart();
  const [picking, setPicking] = useState(false);
  const sizes = allSizes(product);
  const inStock = isInStock(product);
  const totalStock = product.variants.reduce((sum, variant) => sum + variant.stockOnHand, 0);

  const handleQuickAdd = (size: (typeof sizes)[number]) => {
    const variant = product.variants.find((candidate) => candidate.size === size);
    if (!variant || variant.stockOnHand === 0) return;
    addVariant(product, variant);
    setPicking(false);
  };

  return (
    <m.li
      data-card
      className="w-[calc(60%-12px)] shrink-0 [scroll-snap-align:start] md:w-[calc(33%-12px)] lg:w-[calc(25%-12px)]"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -80px 0px" }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
    >
      <article className="group">
        <Link
          href={`/product/${product.slug}`}
          className="block focus-visible:outline-offset-4"
          aria-label={`${product.name} — ${formatPrice(product)}`}
        >
          <div className="relative isolate aspect-[3/4] overflow-hidden bg-paper">
            <div className="h-full w-full transition-transform duration-[400ms] ease-state group-hover:scale-[1.04]">
              <ProductMedia product={product} sizes={NEW_ARRIVALS_CARD_IMAGE_SIZES} priority={priority} />
            </div>

            <span className="label absolute left-3 top-3 z-10 bg-purple-500 px-2.5 py-1 text-paper">
              New
            </span>
            <WishlistHeart product={product} className="absolute right-3 top-3 z-10" />
            <LowStockBadge stockOnHand={totalStock} className="absolute bottom-3 left-3 z-10" />

            {/* Readability gradient, hover-revealed — the quick-add bar below
                needs it, a static image underneath doesn't. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink/60 to-transparent opacity-0 transition-opacity duration-300 ease-state group-hover:opacity-100"
            />

            {inStock && (
              <div
                className="absolute inset-x-0 bottom-0 z-10 translate-y-full opacity-0 transition-[transform,opacity] duration-300 ease-state group-hover:translate-y-0 group-hover:opacity-100"
                onClick={(event) => event.preventDefault()}
              >
                {picking ? (
                  <div className="flex flex-wrap items-center gap-1.5 bg-ink/80 p-2 backdrop-blur-sm">
                    {sizes.map((size) => {
                      const variant = product.variants.find((candidate) => candidate.size === size);
                      const available = (variant?.stockOnHand ?? 0) > 0;
                      return (
                        <button
                          key={size}
                          type="button"
                          disabled={!available}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            handleQuickAdd(size);
                          }}
                          className={cn(
                            "label rounded-full border px-2.5 py-1 transition-colors duration-200 ease-state",
                            available
                              ? "border-paper/40 text-paper hover:border-paper hover:bg-paper hover:text-ink"
                              : "cursor-not-allowed border-dashed border-paper/20 text-paper/40",
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
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      if (sizes.length === 1) handleQuickAdd(sizes[0]);
                      else setPicking(true);
                    }}
                    className="label flex h-9 w-full items-center justify-center bg-ink/80 text-paper backdrop-blur-sm transition-colors duration-200 ease-state hover:bg-ink"
                  >
                    Quick Add
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="mt-3">
            <h3 className="line-clamp-1 font-display text-[14px] font-semibold text-ink">
              {product.name}
            </h3>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-charcoal">
              {product.specs.find((spec) => spec.label === "Shirt")?.value ?? product.category.name}
            </p>
            <p className="mt-1 font-display text-[15px] font-bold text-ink">{formatPrice(product)}</p>
          </div>
        </Link>
      </article>
    </m.li>
  );
}
