import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteNav } from "@/components/sections/site-nav";
import { Hero } from "@/components/sections/hero";
import { FeaturedProducts } from "@/components/sections/featured-products";
import { TopSelling } from "@/components/sections/top-selling";
import { FabricExplorer } from "@/components/sections/fabric-explorer";
import { ProductGrid } from "@/components/sections/product-grid";
import { ProductGridFallback } from "@/components/sections/product-grid-fallback";
import { SignatureSection } from "@/components/sections/signature-section";
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
 * Page rhythm (SKILL.md §6): nav → hero → stitch → grid → dark signature →
 * footer. One bold 3D moment per section, nothing in between.
 *
 * The grid sits behind its own Suspense boundary so a slow catalogue can never
 * hold up the hero — the 3D moment paints on schedule regardless.
 *
 * Reading `searchParams` makes this route dynamic, which is the price of
 * filter state living in the URL. It is the right trade: a filtered grid is a
 * link someone can send, refresh, and bookmark, and the hero above it is static
 * markup either way.
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

        {/*
          No divider between hero and this section — Priority 2's own
          instruction is "zero dead space below the fold", and a stitch rule
          right after a full-viewport hero would itself read as a pause. The
          divider moves to sit between the featured rail and the full grid
          instead, where it still marks a real section change.
        */}
        <FeaturedProducts />

        {/* Top Selling (client brief, 2026-08-24) — between New Arrivals and
            the full collection grid. */}
        <TopSelling />

        {/* Explore by Fabric (client brief, 2026-08-27) — between Top
            Selling and the full collection grid. */}
        <FabricExplorer />

        <div className="mx-auto max-w-shell px-6 md:px-12 lg:px-20">
          <StitchDivider />
        </div>

        <Suspense fallback={<ProductGridFallback />}>
          <ProductGrid searchParams={searchParams} />
        </Suspense>

        {/*
          Atelier directly after the grid, newsletter after that: hero → grid
          → dark signature → newsletter → footer. The dark section is the
          page's rhythm beat (SKILL.md §6) and reads as the closing statement
          on the collection just shown; the newsletter then sits as the quiet
          paper ask right before the footer, rather than being sandwiched
          between two paper blocks with no beat in between.
        */}
        <SignatureSection />

        <NewsletterSignup />
      </main>
      <SiteFooter />
    </>
  );
}
