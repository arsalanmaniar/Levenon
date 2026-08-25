import { ProductCard } from "@/components/products/product-card";
import { ThreadButton } from "@/components/ui/thread-button";
import { Reveal } from "@/components/ui/reveal";
import { listProducts } from "@/lib/server/products";
import type { Product } from "@/lib/types";

/** Sum of stock across every size — a product-level figure from variant-level rows. */
function totalStock(product: Product): number {
  return product.variants.reduce((sum, variant) => sum + variant.stockOnHand, 0);
}

/**
 * "Top Selling" (client brief, 2026-08-24) — between New Arrivals and the
 * full collection grid.
 *
 * There is no sales-history table behind this shop yet, so "top selling" is
 * approximated exactly as the brief specifies: highest total stock on hand,
 * descending. Twelve pieces, standard 3-column grid — no editorial framing,
 * that's what the section above already does.
 */
export async function TopSelling() {
  const catalogue = await listProducts();
  const topSelling = [...catalogue]
    .sort((a, b) => totalStock(b) - totalStock(a))
    .slice(0, 12);

  if (topSelling.length === 0) return null;

  return (
    <section id="top-selling" className="scroll-mt-[var(--nav-h)]">
      <div className="mx-auto max-w-shell px-6 pb-20 pt-4 md:px-10 md:pb-28 md:pt-6">
        <Reveal>
          <div className="border-b border-hairline pb-6">
            <p className="label text-charcoal">Top Selling</p>
            <h2 className="mt-4 font-display text-[clamp(2rem,4.5vw,3.25rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">
              Most loved this season.
            </h2>
          </div>
        </Reveal>

        <ul className="mt-14 grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {topSelling.map((product, index) => (
            <Reveal as="li" key={product.id} delay={Math.min(index, 5) * 0.05}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </ul>

        <div className="mt-16 flex justify-center">
          <ThreadButton href="#collection" tone="outline" icon>
            See More
          </ThreadButton>
        </div>
      </div>
    </section>
  );
}
