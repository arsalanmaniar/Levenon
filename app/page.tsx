import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteNav } from "@/components/sections/site-nav";
import { HeroSlider } from "@/components/sections/hero-slider";
import { FeaturedProducts } from "@/components/sections/featured-products";
import { CategoryBanners } from "@/components/sections/category-banners";
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
import { TrustBar } from "@/components/sections/trust-bar";
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
 * Page rhythm (client brief, 2026-08-30, Item 5 — supersedes the previous
 * pass's own rhythm instruction): nav → hero slider → New Arrivals →
 * category banners → Explore by Fabric → Top Selling → dark signature
 * ("the cloth, before the cut") → Worn & Loved → the full grid → trust bar
 * → newsletter → footer. The announcement bar sits above all of this, in
 * `app/layout.tsx` — every page gets it, not just `/`.
 *
 * **The full collection grid stays on the home page** — the same disclosed
 * call the previous pass made, unchanged by this one: the brief's own
 * 12-line list still never names it, and removing it would still break the
 * many existing `/#collection` deep-links across the site (the atelier
 * page, the PDP's error/not-found/breadcrumb, the cart drawer, search's
 * empty state, `wishlist-contents.tsx`…). `/shop` already serves the
 * identical `ProductGrid` at its own route. Placed where it has
 * structurally sat since the very first pass: closing out the shopping
 * sections before the page's closing beats.
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
        <HeroSlider />

        {/* Own Suspense boundary (client brief, 2026-08-28, Item 4B) — a
            grey pulse placeholder in the section's own shape while the
            catalogue resolves, rather than either section holding up the
            hero or rendering with nothing at all. */}
        <Suspense fallback={<FeaturedProductsFallback />}>
          <FeaturedProducts />
        </Suspense>

        <CategoryBanners />

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

        <TrustBar />

        <NewsletterSignup />
      </main>
      <SiteFooter />
    </>
  );
}
