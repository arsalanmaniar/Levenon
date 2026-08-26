import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteNav } from "@/components/sections/site-nav";
import { Hero } from "@/components/sections/hero";
import { CollectionBanner } from "@/components/sections/collection-banner";
import { FeaturedProducts } from "@/components/sections/featured-products";
import { TopSelling } from "@/components/sections/top-selling";
import { FabricExplorer } from "@/components/sections/fabric-explorer";
import { ProductGrid } from "@/components/sections/product-grid";
import {
  ProductGridFallback,
  FeaturedProductsFallback,
  TopSellingFallback,
} from "@/components/sections/product-grid-fallback";
import { SignatureSection } from "@/components/sections/signature-section";
import { WornAndLoved } from "@/components/sections/worn-and-loved";
import { NewsletterSignup } from "@/components/newsletter/newsletter-signup";
import { SiteFooter } from "@/components/sections/site-footer";
import { StitchDivider } from "@/components/ui/stitch-divider";
import type { FilterSearchParams } from "@/lib/filters";

/**
 * The home page is also the collection/listing page — the grid lives here at
 * #collection rather than on a separate route. Its metadata is therefore set
 * explicitly instead of inheriting the root defaults verbatim.
 */
export const metadata: Metadata = {
  // Absolute: the wordmark leads here, so the template suffix is skipped.
  title: { absolute: "Levenon — Unstitched. Yours to finish." },
  description:
    "Twelve unstitched three-piece suits — lawn, cotton, chiffon, silk, organza and net, embroidered by hand and cut to your own measurements.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    title: "Levenon — Unstitched. Yours to finish.",
    description:
      "Twelve unstitched three-piece suits — lawn, cotton, chiffon, silk, organza and net.",
  },
};

/**
 * Page rhythm (client brief, 2026-08-29, Item 5 — "flow like a premium
 * fashion magazine"): nav → hero → collection banner → New Arrivals →
 * Explore by Fabric → Top Selling → dark signature ("the cloth, before the
 * cut") → Worn & Loved → the full grid → newsletter → footer.
 *
 * Two deliberate departures from the brief's own 11-line list, both
 * disclosed rather than silently resolved:
 *
 * 1. **The full collection grid stays on the home page.** The brief's list
 *    never names it, and taken completely literally "remove any section
 *    that breaks this rhythm" would delete it — but doing that would break
 *    the fourteen-plus existing `/#collection` links across the site (the
 *    atelier page, the PDP's own error/not-found/breadcrumb, the cart
 *    drawer, search's empty state, this page's own new banner and hero
 *    CTAs, `wishlist-contents.tsx`…), all of which assume that id exists on
 *    `/`. `/shop` already serves the identical `ProductGrid` at its own
 *    route (built specifically so the nav no longer *needed* to point at
 *    this section) — but silently deleting a still-linked section is a
 *    bigger, riskier call than the brief made explicitly, so it stays,
 *    placed where it always structurally sat: closing out the shopping
 *    sections before the page's closing editorial/newsletter beat.
 * 2. **Worn & Loved sits after the dark signature section, not immediately
 *    after Top Selling.** Item 3's own text says "below Top Selling, above
 *    the full collection grid," which conflicts with Item 5's explicit
 *    enumerated order (dark section at position 8, Worn & Loved at 9) —
 *    Item 5 is the later, more specific "enforce this exact order"
 *    instruction, so it wins the ordering; Worn & Loved still lands above
 *    the grid, per Item 3, just with the dark section between them rather
 *    than directly adjacent.
 *
 * The grid keeps its own Suspense boundary so a slow catalogue can never hold
 * up anything above it. Reading `searchParams` keeps the route dynamic, which
 * is the price of filter state living in the URL — a filtered grid is a link
 * someone can send, refresh, and bookmark.
 */
export default function HomePage({
  searchParams,
}: {
  searchParams?: FilterSearchParams;
}) {
  return (
    <>
      <SiteNav />
      <main id="main">
        <Hero />

        <CollectionBanner />

        {/* Own Suspense boundary (client brief, 2026-08-28, Item 4B) — a
            grey pulse placeholder in the section's own shape while the
            catalogue resolves, rather than either section holding up the
            hero or rendering with nothing at all. */}
        <Suspense fallback={<FeaturedProductsFallback />}>
          <FeaturedProducts />
        </Suspense>

        {/* Explore by Fabric now precedes Top Selling (client brief,
            2026-08-29, Item 5 — the previous pass had these swapped). */}
        <FabricExplorer />

        <Suspense fallback={<TopSellingFallback />}>
          <TopSelling />
        </Suspense>

        <SignatureSection />

        <WornAndLoved />

        <div className="mx-auto max-w-shell px-6 md:px-12 lg:px-20">
          <StitchDivider />
        </div>

        <Suspense fallback={<ProductGridFallback />}>
          <ProductGrid searchParams={searchParams} />
        </Suspense>

        <NewsletterSignup />
      </main>
      <SiteFooter />
    </>
  );
}
