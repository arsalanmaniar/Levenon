import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteNav } from "@/components/sections/site-nav";
import { SiteFooter } from "@/components/sections/site-footer";
import { ProductGrid } from "@/components/sections/product-grid";
import { ProductGridFallback } from "@/components/sections/product-grid-fallback";
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
export default function ShopPage({
  searchParams,
}: {
  searchParams?: FilterSearchParams;
}) {
  return (
    <>
      <SiteNav />
      <main id="main">
        <Suspense fallback={<ProductGridFallback />}>
          <ProductGrid searchParams={searchParams} />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
