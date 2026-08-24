import { ProductGridSkeleton } from "@/components/products/product-card-skeleton";
import { ThreadLoader } from "@/components/ui/thread-loader";

/**
 * Suspense fallback for the collection.
 *
 * Renders the section's real chrome — heading, hairline rule, grid shape — so
 * the page has its final geometry before the catalogue lands and nothing shifts
 * underneath the reader.
 */
export function ProductGridFallback() {
  return (
    <section id="collection" className="scroll-mt-[var(--nav-h)]">
      <div className="mx-auto max-w-shell px-6 py-20 md:px-10 md:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-hairline pb-8">
          <div>
            <p className="label text-charcoal">The collection</p>
            <h2 className="mt-4 font-display text-[clamp(2rem,4.5vw,3.25rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">
              This season, in full
            </h2>
          </div>
          <ThreadLoader label="Counting the rail" />
        </div>

        <ProductGridSkeleton />
      </div>
    </section>
  );
}
