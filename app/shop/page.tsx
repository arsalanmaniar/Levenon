import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteNav } from "@/components/sections/site-nav";
import { SiteFooter } from "@/components/sections/site-footer";
import { ProductGrid } from "@/components/sections/product-grid";
import { ProductGridFallback } from "@/components/sections/product-grid-fallback";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { getCollectionSummary } from "@/lib/server/products";
import type { FilterSearchParams } from "@/lib/filters";

export const metadata: Metadata = {
  title: "Shop",
  description: "The full Levenon collection — unstitched three-piece suits, filterable by fabric and price.",
  alternates: { canonical: "/shop" },
};

/**
 * Dedicated shop route (client brief, 2026-08-26) — the nav's "Shop" link
 * used to scroll to `#collection` on the home page; it now lands here
 * instead. Reuses `ProductGrid` verbatim (the same component the home page's
 * `#collection` section renders), so filtering, sorting and the empty states
 * all stay identical — this is a new address for existing behaviour, not a
 * second implementation of it. The home page keeps its own inline grid too;
 * nothing about `/` changed.
 */
export default async function ShopPage({
  searchParams,
}: {
  searchParams?: FilterSearchParams;
}) {
  const { pieceCount } = await getCollectionSummary();

  return (
    <>
      <SiteNav />
      <main id="main">
        {/* Slim page hero (client brief, 2026-08-30, Item 6E) — 200px,
            title + live count, a hairline bottom border. Sits above
            `ProductGrid`'s own, richer heading rather than replacing it:
            that heading is shared with the home page's inline grid, so
            changing it here would change it there too. */}
        <div className="flex h-[200px] flex-col justify-end border-b border-hairline">
          <div className="mx-auto w-full max-w-shell px-6 pb-8 md:px-12 lg:px-20">
            <Breadcrumbs items={[{ label: "Shop" }]} />
            <div className="mt-4 flex flex-wrap items-baseline justify-between gap-4">
              <h1 className="font-display text-h2 font-extrabold tracking-[-0.02em]">
                Shop
              </h1>
              <p className="label text-charcoal">
                {pieceCount} {pieceCount === 1 ? "piece" : "pieces"}
              </p>
            </div>
          </div>
        </div>

        <Suspense fallback={<ProductGridFallback />}>
          <ProductGrid searchParams={searchParams} />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
