import Link from "next/link";
import { cn } from "@/lib/cn";
import {
  activeFilterChips,
  buildFilterHref,
  EMPTY_FILTERS,
  type FilterSearchParams,
  type ProductFilters,
} from "@/lib/filters";
import type { Category, Currency } from "@/lib/types";

type ActiveFilterChipsProps = {
  filters: ProductFilters;
  categories: readonly Category[];
  currency: Currency;
  searchParams?: FilterSearchParams;
  className?: string;
};

/**
 * One dismissible chip per active filter, plus a clear-all.
 *
 * Every chip is a link to the URL without that filter, so the state it removes
 * is visible in the status bar before the click and survives a middle-click
 * into a new tab. Nothing here is interactive beyond navigation, so nothing
 * here needs JavaScript.
 */
export function ActiveFilterChips({
  filters,
  categories,
  currency,
  searchParams,
  className,
}: ActiveFilterChipsProps) {
  const chips = activeFilterChips(filters, { categories, currency });
  if (chips.length === 0) return null;

  return (
    <div className={cn("min-w-0", className)}>
      <h3 className="sr-only">Active filters</h3>

      <ul className="flex flex-wrap items-center gap-2">
        {chips.map((chip) => (
          <li key={chip.key}>
            <Link
              href={buildFilterHref(chip.next, searchParams)}
              scroll={false}
              className="label group inline-flex min-h-[44px] items-center gap-2 rounded-full border border-purple-500 px-5 text-purple-500 transition-colors duration-200 ease-state hover:bg-purple-500 hover:text-paper"
            >
              {chip.label}
              <span className="sr-only">— remove filter</span>
              <span aria-hidden="true" className="text-[clamp(0.6875rem,1vw,0.8125rem)] leading-none">
                &times;
              </span>
            </Link>
          </li>
        ))}

        {chips.length > 1 && (
          <li>
            <Link
              href={buildFilterHref(EMPTY_FILTERS, searchParams)}
              scroll={false}
              className="label inline-flex min-h-[44px] items-center px-3 text-charcoal underline decoration-hairline underline-offset-4 transition-colors duration-200 ease-state hover:text-purple-500 hover:decoration-purple-500"
            >
              Clear all
            </Link>
          </li>
        )}
      </ul>
    </div>
  );
}
