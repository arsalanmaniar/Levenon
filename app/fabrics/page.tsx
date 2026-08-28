import type { Metadata } from "next";
import { SiteNav } from "@/components/sections/site-nav";
import { SiteFooter } from "@/components/sections/site-footer";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { FabricGuideClient } from "@/components/fabric-guide/fabric-guide-client";
import { FABRIC_GUIDE } from "@/lib/fabric-guide-data";
import { listCategories, listProducts } from "@/lib/server/products";
import { isInStock, type Product } from "@/lib/types";

export const metadata: Metadata = {
  title: "Fabric Guide",
  description: "An interactive guide to the six fabrics Levenon works in — origin, texture, care, and what each is best for.",
  alternates: { canonical: "/fabrics" },
};

const RELATED_PER_FABRIC = 3;

/**
 * Fabric Guide (client brief, 2026-08-31) — the pass's second new feature.
 * Categories and products are fetched once here and handed down as plain
 * data; `FabricGuideClient` owns the compare-two-fabrics interaction and
 * renders everything from that one payload.
 */
export default async function FabricsPage() {
  const [categories, products] = await Promise.all([listCategories(), listProducts()]);

  const productsByCategory = new Map<string, Product[]>();
  for (const entry of FABRIC_GUIDE) {
    const matches = products.filter((product) => product.category.slug === entry.slug && isInStock(product));
    productsByCategory.set(entry.slug, matches.slice(0, RELATED_PER_FABRIC));
  }

  return (
    <>
      <SiteNav />
      <main id="main">
        <div className="flex h-[200px] flex-col justify-end border-b border-hairline">
          <div className="mx-auto w-full max-w-shell px-6 pb-8 md:px-12 lg:px-20">
            <Breadcrumbs items={[{ label: "Fabric Guide" }]} />
            <h1 className="mt-4 font-display text-h2 font-extrabold tracking-[-0.02em]">
              Fabric Guide
            </h1>
            <p className="mt-2 text-body text-charcoal">
              Six fabrics, what makes each one different, and how to care for it.
            </p>
          </div>
        </div>

        <FabricGuideClient
          entries={FABRIC_GUIDE}
          categories={categories}
          productsByCategory={productsByCategory}
        />
      </main>
      <SiteFooter />
    </>
  );
}
