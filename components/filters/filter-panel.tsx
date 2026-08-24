import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { PriceFilterForm } from "./price-filter-form";
import { cn } from "@/lib/cn";
import {
  buildFilterHref,
  passthroughParams,
  type FilterSearchParams,
  type ProductFilters,
} from "@/lib/filters";
import type { Category, Currency } from "@/lib/types";

type FilterPanelProps = {
  filters: ProductFilters;
  categories: readonly Category[];
  searchParams?: FilterSearchParams;
  currency: Currency;
  /** Catalogue price range in minor units. Null when the rail is empty. */
  bounds: { min: number; max: number } | null;
  /**
   * Unique per instance. The panel is rendered twice — inline for desktop and
   * inside the mobile drawer — so every id it mints has to be namespaced or the
   * labels point at the wrong controls.
   */
  idPrefix: string;
  /** `inline` lays the groups out in a row; `stacked` is the drawer. */
  layout?: "inline" | "stacked";
  className?: string;
};

const pillBase =
  "label inline-flex min-h-[44px] items-center rounded-full border px-5 py-3 " +
  "transition-colors duration-200 ease-state";

/**
 * The filter panel: category, price, in stock.
 *
 * A Server Component — every control is either a link or a form field, so the
 * whole panel works before (and without) hydration. Only the price form needs
 * client JS, and that is a small leaf.
 *
 * Categories are links rather than form controls on purpose: a category is a
 * destination, it belongs in the address bar, and a link gets middle-click,
 * open-in-new-tab and copy-link for free.
 */
export function FilterPanel({
  filters,
  categories,
  searchParams,
  currency,
  bounds,
  idPrefix,
  layout = "inline",
  className,
}: FilterPanelProps) {
  const categoryLabelId = `${idPrefix}-category-label`;
  const passthrough = passthroughParams(searchParams);

  const options = [
    { slug: null as string | null, name: "All" },
    ...categories.map((category) => ({
      slug: category.slug as string | null,
      name: category.name,
    })),
  ];

  return (
    <div
      className={cn(
        layout === "inline"
          ? "flex flex-wrap items-end justify-between gap-x-10 gap-y-8"
          : "space-y-10",
        className,
      )}
    >
      {layout === "inline" && (
        <h3 className="flex w-full items-center gap-2 font-display text-xl font-extrabold tracking-[-0.02em]">
          <SlidersHorizontal aria-hidden="true" strokeWidth={1.5} className="h-5 w-5 text-purple-500" />
          Refine
        </h3>
      )}

      <nav aria-labelledby={categoryLabelId} className="min-w-0">
        <p id={categoryLabelId} className="label text-charcoal">
          Category
        </p>

        <ul className="mt-4 flex flex-wrap gap-2">
          {options.map((option) => {
            const isActive = filters.category === option.slug;
            return (
              <li key={option.slug ?? "all"}>
                <Link
                  href={buildFilterHref(
                    { ...filters, category: option.slug },
                    searchParams,
                  )}
                  scroll={false}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    pillBase,
                    isActive
                      ? "border-purple-500 bg-purple-500 text-paper"
                      : "border-hairline text-charcoal hover:border-purple-500 hover:text-purple-500",
                  )}
                >
                  {option.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <PriceFilterForm
        // Remount when the URL changes: the uncontrolled inputs take their
        // values from the filters, so this is the one moment they should reset.
        key={`${filters.priceMin ?? ""}-${filters.priceMax ?? ""}-${
          filters.inStockOnly ? "1" : "0"
        }-${filters.category ?? ""}`}
        filters={filters}
        passthrough={passthrough}
        currency={currency}
        bounds={bounds}
        idPrefix={idPrefix}
        stacked={layout === "stacked"}
        className={layout === "stacked" ? "flex-col items-stretch" : undefined}
      />
    </div>
  );
}
