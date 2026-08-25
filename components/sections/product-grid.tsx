import { LoadMoreGrid } from "@/components/products/load-more-grid";
import { ActiveFilterChips } from "@/components/filters/active-filter-chips";
import { FilterDrawer } from "@/components/filters/filter-drawer";
import { FilterPanel } from "@/components/filters/filter-panel";
import { ThreadButton } from "@/components/ui/thread-button";
import { Reveal } from "@/components/ui/reveal";
import {
  buildFilterHref,
  EMPTY_FILTERS,
  activeFilterCount,
  hasActiveFilters,
  parseFilters,
  toProductQuery,
  type FilterSearchParams,
} from "@/lib/filters";
import {
  listProducts,
  listCategories,
  getCollectionSummary,
} from "@/lib/server/products";
import type { Currency, Product } from "@/lib/types";

/**
 * The collection grid — a Server Component reading the data layer directly.
 *
 * No fetch of our own API here: an app HTTP-calling itself buys nothing but a
 * round trip. The route handlers in app/api/products exist for client-side and
 * external callers.
 *
 * Filter state arrives as `searchParams` and is parsed once, here, against the
 * live taxonomy — which is why the categories are read before the filtered
 * list. Everything below this line is a pure function of that parse.
 *
 * Two empty states, and they are not the same thing: an empty catalogue is the
 * season being between cuts; an empty *result* is the reader's filters being
 * too narrow, and it has to offer a way out.
 */
export async function ProductGrid({
  searchParams,
}: {
  searchParams?: FilterSearchParams;
}) {
  const [categories, catalogue, summary] = await Promise.all([
    listCategories(),
    // The unfiltered rail, for the price placeholders and — more importantly —
    // to tell "no matches" apart from "nothing on the rail".
    listProducts(),
    getCollectionSummary(),
  ]);

  const filters = parseFilters(
    searchParams,
    categories.map((category) => category.slug),
  );
  const filtered = hasActiveFilters(filters);

  // Only pay for the second read when there is actually something to filter by.
  const products: Product[] = filtered
    ? await listProducts(toProductQuery(filters))
    : catalogue;

  const currency: Currency = catalogue[0]?.currency ?? "PKR";
  const bounds =
    catalogue.length > 0
      ? {
          min: Math.min(...catalogue.map((product) => product.priceMinor)),
          max: Math.max(...catalogue.map((product) => product.priceMinor)),
        }
      : null;

  const clearHref = buildFilterHref(EMPTY_FILTERS, searchParams);
  const catalogueEmpty = catalogue.length === 0;

  return (
    <section id="collection" className="scroll-mt-[var(--nav-h)]">
      <div className="mx-auto max-w-shell px-6 py-20 md:px-12 lg:px-20 md:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-hairline pb-8">
          <Reveal>
            <div>
              <p className="label text-charcoal">The collection</p>
              {/* Rewritten per the client's revision brief (2026-08-24). */}
              <h2 className="mt-4 font-display text-balance text-h2 font-extrabold leading-[1.02] tracking-[-0.03em]">
                The Edit — Unstitched, yours to finish
              </h2>
              <p className="mt-4 max-w-[46ch] text-body leading-relaxed text-charcoal">
                Each piece is raw cloth. You choose the tailor, the fit, the
                finish. We choose the fabric.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <p className="label text-charcoal">
              {filtered
                ? `${products.length} of ${summary.pieceCount} pieces`
                : `${summary.pieceCount} pieces — unstitched`}
            </p>
          </Reveal>
        </div>

        {!catalogueEmpty && (
          <>
            {/* Desktop: the panel sits inline, open, above the grid. */}
            <div className="hidden border-b border-hairline py-8 lg:block">
              <h3 className="sr-only">Filter the collection</h3>
              <FilterPanel
                filters={filters}
                categories={categories}
                searchParams={searchParams}
                currency={currency}
                bounds={bounds}
                idPrefix="filters-inline"
                layout="inline"
              />
            </div>

            {/* Mobile: the same panel, in a slide-up drawer. */}
            <div className="flex flex-wrap items-center gap-4 border-b border-hairline py-6 lg:hidden">
              <h3 className="sr-only">Filter the collection</h3>
              <FilterDrawer
                activeCount={activeFilterCount(filters)}
                resultCount={products.length}
                clearHref={clearHref}
              >
                <FilterPanel
                  filters={filters}
                  categories={categories}
                  searchParams={searchParams}
                  currency={currency}
                  bounds={bounds}
                  idPrefix="filters-drawer"
                  layout="stacked"
                />
              </FilterDrawer>

              <p className="label text-charcoal">
                {products.length === 1
                  ? "1 piece shown"
                  : `${products.length} pieces shown`}
              </p>
            </div>

            <ActiveFilterChips
              filters={filters}
              categories={categories}
              currency={currency}
              searchParams={searchParams}
              className="mt-6"
            />
          </>
        )}

        {catalogueEmpty ? (
          <Reveal>
            <p className="mt-16 max-w-measure text-base leading-relaxed text-charcoal">
              The edit is between drops. Nothing is on the rail right now —
              check back shortly.
            </p>
          </Reveal>
        ) : products.length === 0 ? (
          <Reveal>
            <div className="mt-16">
              <p className="label text-charcoal">No match</p>
              <p className="mt-4 max-w-measure text-base leading-relaxed text-charcoal">
                Nothing on the rail answers these filters. The run is small —
                widen the price, or take one of them off.
              </p>
              <ThreadButton
                href={clearHref}
                tone="outline"
                scroll={false}
                className="mt-8"
              >
                Clear filters
              </ThreadButton>
            </div>
          </Reveal>
        ) : (
          <LoadMoreGrid products={products} />
        )}
      </div>
    </section>
  );
}
