"use client";

import { useEffect } from "react";
import { useRecentlyViewed } from "./recently-viewed-provider";
import { ProductCard } from "@/components/products/product-card";
import { SpotlightSurface } from "@/components/ui/spotlight-surface";
import type { Product } from "@/lib/types";

/**
 * Records the current product and shows everything else recently seen.
 *
 * Both jobs live in one component on purpose: recording on mount and reading
 * the list in the same render means the current product is filtered out by id
 * rather than by ordering luck, so a page can never list itself.
 *
 * Renders nothing at all when there is nothing else to show — an empty strip
 * with a heading is worse than no strip.
 */
export function RecentlyViewedStrip({ product }: { product: Product }) {
  const { record, except } = useRecentlyViewed();

  // Record after paint. The dependency is the id, not the object: a new
  // reference for the same product (a re-render, an ISR refresh) must not
  // re-record and churn the list.
  useEffect(() => {
    record(product);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const others = except(product.id);
  if (others.length === 0) return null;

  return (
    <section
      aria-labelledby="recently-viewed-heading"
      className="border-t border-hairline"
    >
      <div className="mx-auto max-w-shell px-6 py-16 md:px-10 md:py-20">
        <h2 id="recently-viewed-heading" className="label text-charcoal">
          Recently viewed
        </h2>

        {/* One pointer listener for the strip, like the main grid. */}
        <SpotlightSurface>
          {/*
            Horizontal scroll rather than wrap: the strip is a tail, not a
            second grid. `-mx-6 px-6` lets cards bleed to the viewport edge on
            mobile while keeping the first one aligned to the page gutter, and
            the negative margin is cancelled by the padding so nothing escapes
            the document width.
          */}
          <ul className="-mx-6 mt-8 flex snap-x snap-mandatory gap-6 overflow-x-auto px-6 pb-4 md:-mx-10 md:px-10">
            {others.map((item) => (
              <li
                key={item.id}
                className="w-[240px] shrink-0 snap-start sm:w-[280px]"
              >
                <ProductCard product={item} />
              </li>
            ))}
          </ul>
        </SpotlightSurface>
      </div>
    </section>
  );
}
