"use client";

import { useState } from "react";
import { ProductCard } from "./product-card";
import { SpotlightSurface } from "@/components/ui/spotlight-surface";
import { ShimmerAction } from "@/components/ui/shimmer-button";
import { Reveal } from "@/components/ui/reveal";
import type { Product } from "@/lib/types";

const PAGE_SIZE = 12;

/**
 * The full filtered result set arrives from the server in one payload — up
 * to 48 products, well within a single response — and this client island
 * only ever slices what's already in memory. "Load more" is a state change,
 * not a fetch: there is no `/api/products?page=2` and there does not need to
 * be one for a catalogue this size. A second network round trip would be
 * pure latency for zero new information.
 */
export function LoadMoreGrid({
  products,
  /** First 8 ids of the default catalogue order (client brief, 2026-08-29, Item 7). */
  newArrivalIds,
}: {
  products: Product[];
  newArrivalIds?: Set<string>;
}) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visible = products.slice(0, visibleCount);
  const remaining = products.length - visible.length;

  return (
    <>
      <SpotlightSurface>
        {/* Two tight columns below `sm` (a single stacked column left the
            season's whole 48-piece rail as one long mobile scroll), opening
            up to the wider gutter from `sm` where a card has room to breathe. */}
        {/* Even column gaps (client brief, 2026-08-26): gap-4 mobile,
            gap-6 desktop, both axes equal rather than the previous
            asymmetric x/y split. */}
        <ul className="mt-12 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 2xl:grid-cols-4">
          {visible.map((product, index) => (
            <Reveal
              as="li"
              key={product.id}
              // 60ms per card, capped at eight deep so a long result list
              // never queues scrolling behind a growing delay. Cards
              // revealed by "Load more" are already on screen when they
              // mount, so Reveal's own above-the-fold rule (see reveal.tsx)
              // leaves them un-animated rather than fading in from nothing.
              delay={Math.min(index, 7) * 0.06}
            >
              {/*
                Two, not four. Four was chosen for the widest desktop row,
                but `priority` is not responsive — it forced four eager,
                `fetchpriority="high"` image requests on phones too, where
                the grid is two columns and the collection sits far below
                the fold behind the whole hero and editorial rail. Measured
                on an emulated phone those four were competing with the
                document and the fonts for bandwidth while contributing
                nothing to LCP (which is the hero `<h1>`, not an image).
                The rest lazy-load, which is what they should always have
                done here.
              */}
              <ProductCard
                product={product}
                priority={index < 2}
                isNew={newArrivalIds?.has(product.id) ?? false}
              />
            </Reveal>
          ))}
        </ul>
      </SpotlightSurface>

      {remaining > 0 && (
        <div className="mt-14 flex flex-col items-center gap-3">
          <ShimmerAction
            type="button"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            className="min-h-[52px] px-10"
          >
            Load more
          </ShimmerAction>
          <p className="label text-charcoal">
            {visible.length} of {products.length} pieces
          </p>
        </div>
      )}
    </>
  );
}
