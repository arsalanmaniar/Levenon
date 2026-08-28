import type { Metadata } from "next";
import { SiteNav } from "@/components/sections/site-nav";
import { SiteFooter } from "@/components/sections/site-footer";
import { StyleFinderClient } from "@/components/style-finder/style-finder-client";
import { listProducts } from "@/lib/server/products";

export const metadata: Metadata = {
  title: "Style Finder",
  description: "A four-question quiz that matches you to pieces from the Levenon catalogue.",
  alternates: { canonical: "/style-finder" },
};

/**
 * Style Finder (client brief, 2026-08-31) — one of the pass's two new
 * features. Server component fetches the full in-stock-relevant catalogue
 * once; `StyleFinderClient` does the quiz, the scoring (`lib/style-finder.ts`)
 * and the results grid entirely client-side from that one payload — no
 * per-answer network request.
 */
export default async function StyleFinderPage() {
  const products = await listProducts();

  return (
    <>
      <SiteNav />
      <main id="main">
        <StyleFinderClient products={products} />
      </main>
      <SiteFooter />
    </>
  );
}
