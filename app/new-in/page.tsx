import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteNav } from "@/components/sections/site-nav";
import { SiteFooter } from "@/components/sections/site-footer";
import { FeaturedProducts } from "@/components/sections/featured-products";
import { FeaturedProductsFallback } from "@/components/sections/product-grid-fallback";

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
        <Suspense fallback={<FeaturedProductsFallback />}>
          <FeaturedProducts />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
