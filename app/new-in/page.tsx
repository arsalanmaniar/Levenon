import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteNav } from "@/components/sections/site-nav";
import { SiteFooter } from "@/components/sections/site-footer";
import { FeaturedProducts } from "@/components/sections/featured-products";
import { FeaturedProductsFallback } from "@/components/sections/product-grid-fallback";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export const metadata: Metadata = {
  title: "New In",
  description: "The newest pieces in the Levenon edit.",
  alternates: { canonical: "/new-in" },
};

/**
 * Dedicated New In route (client brief, 2026-08-26) — reuses
 * `FeaturedProducts` verbatim, the same editorial rail the home page shows
 * under the hero. "Just the New Arrivals section, full page" per the brief;
 * the home page's own copy is untouched.
 */
export default function NewInPage() {
  return (
    <>
      <SiteNav />
      <main id="main">
        <div className="mx-auto max-w-shell px-6 pt-8 md:px-12 lg:px-20">
          <Breadcrumbs items={[{ label: "New In" }]} />
        </div>
        <Suspense fallback={<FeaturedProductsFallback />}>
          <FeaturedProducts />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
