import { NewArrivalsCarousel } from "./new-arrivals-carousel";
import { listProducts } from "@/lib/server/products";

/**
 * "Just landed" — full redesign (client brief, 2026-08-31): the 1+3
 * editorial grid this component used to render is gone entirely, replaced
 * with a horizontal scroll carousel, Maria B/Sapphire "Most Trending"
 * style — see `new-arrivals-carousel.tsx` for the header/scroller/arrows
 * and `new-arrival-card.tsx` for the card itself. `QuickAddCard`, which
 * existed only for the old layout, is deleted this pass.
 *
 * "Latest 8" reads literally as the brief's own words: `catalogue.slice(-8)`,
 * the last eight rows in the array as stored — not a `createdAt` sort, which
 * is what the previous rail used. Reversed after slicing so the row added
 * most recently (the very last element) renders *first* in the carousel;
 * the brief said which eight, not which order, and "new arrivals" reading
 * newest-first is the only order that makes sense for the label.
 */
export async function FeaturedProducts() {
  const catalogue = await listProducts();
  const products = catalogue.slice(-8).reverse();

  if (products.length === 0) return null;

  return (
    <section id="new-in" className="scroll-mt-[var(--nav-h)]">
      <div className="mx-auto max-w-shell pb-20 pt-20 md:pb-28 md:pt-24">
        <NewArrivalsCarousel products={products} />
      </div>
    </section>
  );
}
