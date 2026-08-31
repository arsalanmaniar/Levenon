import {
  ProductCardSkeleton,
  ProductGridSkeleton,
} from "@/components/products/product-card-skeleton";
import { ThreadLoader } from "@/components/ui/thread-loader";

/**
 * Suspense fallback for the collection.
 *
 * Renders the section's real chrome — heading, hairline rule, grid shape — so
 * the page has its final geometry before the catalogue lands and nothing shifts
 * underneath the reader.
 */
export function ProductGridFallback() {
  return (
    <section id="collection" className="scroll-mt-[var(--nav-h)]">
      <div className="mx-auto max-w-shell px-6 py-20 md:px-12 lg:px-20 md:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-hairline pb-8">
          <div>
            <p className="label text-charcoal">The collection</p>
            <h2 className="mt-4 font-display text-balance text-h2 font-extrabold leading-[1.02] tracking-[-0.03em]">
              This season, in full
            </h2>
          </div>
          <ThreadLoader label="Counting the rail" />
        </div>

        <ProductGridSkeleton />
      </div>
    </section>
  );
}

/**
 * Suspense fallback for `FeaturedProducts` (client brief, 2026-08-28 — Item
 * 4B names "new arrivals" explicitly; layout updated 2026-08-31 for the
 * carousel redesign). Mirrors the real header row and a horizontal strip of
 * card-shaped placeholders — not scrollable itself, just enough of the real
 * shape that nothing visibly reflows once the catalogue resolves and the
 * carousel's own scroll/arrow behaviour takes over.
 */
export function FeaturedProductsFallback() {
  return (
    <section id="new-in" className="scroll-mt-[var(--nav-h)]">
      <div className="mx-auto max-w-shell pb-20 pt-20 md:pb-28 md:pt-24">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 px-6 md:px-12 lg:px-20">
          <div>
            <p className="label text-charcoal">New Arrivals</p>
            <h2 className="mt-4 font-display text-balance text-h2 font-extrabold leading-[1.02] tracking-[-0.03em]">
              Just landed.
            </h2>
          </div>
        </div>

        <div className="no-scrollbar mt-10 flex gap-6 overflow-x-hidden px-6 md:px-12 lg:px-20">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="w-[calc(60%-12px)] shrink-0 md:w-[calc(33%-12px)] lg:w-[calc(25%-12px)]">
              <ProductCardSkeleton />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Suspense fallback for `TopSelling` (client brief, 2026-08-28 — Item 4B
 * names "top selling" explicitly). Same chrome, same 12-card 3-column grid.
 */
export function TopSellingFallback() {
  return (
    <section id="top-selling" className="scroll-mt-[var(--nav-h)]">
      <div className="mx-auto max-w-shell px-6 pb-20 pt-4 md:px-12 lg:px-20 md:pb-28 md:pt-6">
        <div className="border-b border-hairline pb-6">
          <p className="label text-charcoal">Top Selling</p>
          <h2 className="mt-4 font-display text-balance text-h2 font-extrabold leading-[1.02] tracking-[-0.03em]">
            Most loved this season.
          </h2>
        </div>

        <ul className="mt-14 grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 12 }, (_, i) => (
            <li key={i}>
              <ProductCardSkeleton />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
