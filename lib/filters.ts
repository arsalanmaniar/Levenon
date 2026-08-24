import { formatMinor } from "@/lib/cart/types";
import type { Category, Currency } from "@/lib/types";

/**
 * Product filter state — parsed from, and serialised back into, the URL.
 *
 * Filter state lives in `searchParams` and nowhere else. A filtered grid is a
 * shareable URL that survives a refresh, the back button, and a cold load with
 * no JavaScript at all. Nothing here holds state; everything is a pure function
 * of the query string.
 *
 * Two unit systems meet in this file, deliberately:
 *
 *   URL      major units — `?priceMax=25000` reads as PKR 25,000 to a human
 *                          pasting the link, which is the point of putting the
 *                          state in the URL in the first place.
 *   Internal minor units — integer paisa, the only money representation the
 *                          data layer accepts. Money is never a float here, so
 *                          the conversion is an integer multiply by 100 and the
 *                          parser refuses anything that is not whole.
 */

/** The shape Next hands a page as `searchParams`. */
export type FilterSearchParams = Record<string, string | string[] | undefined>;

export type ProductFilters = {
  /** Category slug, already validated against the live taxonomy. */
  category: string | null;
  /** Inclusive bounds, in integer minor units. */
  priceMin: number | null;
  priceMax: number | null;
  inStockOnly: boolean;
};

/**
 * The subset of `ListProductsOptions` these filters produce.
 *
 * Declared structurally rather than imported: `lib/server/products` is
 * `server-only`, and this module is reached from client components.
 */
export type ProductFilterQuery = {
  category?: string;
  priceMin?: number;
  priceMax?: number;
  inStockOnly?: boolean;
};

export const FILTER_PARAMS = {
  category: "category",
  priceMin: "priceMin",
  priceMax: "priceMax",
  inStock: "inStock",
} as const;

const OWNED_PARAMS: readonly string[] = Object.values(FILTER_PARAMS);

export const EMPTY_FILTERS: ProductFilters = {
  category: null,
  priceMin: null,
  priceMax: null,
  inStockOnly: false,
};

/**
 * Ceiling on a price bound, in major units.
 *
 * Not a business rule — a parser guard. It stops `?priceMin=9999999999999999999`
 * reaching the data layer as a number that has already lost precision.
 */
const MAX_MAJOR = 99_999_999;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const WHOLE_NUMBER = /^\d+$/;
const TRUTHY = new Set(["1", "true", "yes", "on"]);

function firstValue(raw: string | string[] | undefined): string | null {
  if (Array.isArray(raw)) return raw.length > 0 ? raw[0] : null;
  return raw ?? null;
}

/** Major-unit string from the URL to integer minor units, or null if unusable. */
function parseMoney(raw: string | null): number | null {
  if (raw === null) return null;
  // Tolerate the separators a human pastes back in: "25,000" and "25 000".
  const cleaned = raw.trim().replace(/[,\s_]/g, "");
  if (cleaned === "" || !WHOLE_NUMBER.test(cleaned)) return null;
  const major = Number(cleaned);
  if (!Number.isSafeInteger(major) || major < 0 || major > MAX_MAJOR) return null;
  return major * 100;
}

/** Integer minor units back to the major-unit string that goes in the URL. */
function serialiseMoney(minor: number): string {
  return String(Math.round(minor / 100));
}

/**
 * Parse filters out of `searchParams`.
 *
 * Defensive by construction: anything unparseable is dropped, never honoured.
 * A garbage value degrades to "that filter is off" rather than to an empty
 * grid, because a link with a typo in it should still show the collection.
 *
 * @param knownCategorySlugs when supplied, a slug outside the live taxonomy is
 *   dropped. Without it only the slug *shape* can be checked.
 */
export function parseFilters(
  searchParams: FilterSearchParams | undefined,
  knownCategorySlugs?: readonly string[],
): ProductFilters {
  if (!searchParams) return EMPTY_FILTERS;

  const rawCategory = firstValue(searchParams[FILTER_PARAMS.category])
    ?.trim()
    .toLowerCase();

  let category: string | null = null;
  if (rawCategory && rawCategory.length <= 64 && SLUG.test(rawCategory)) {
    category =
      !knownCategorySlugs || knownCategorySlugs.includes(rawCategory)
        ? rawCategory
        : null;
  }

  let priceMin = parseMoney(firstValue(searchParams[FILTER_PARAMS.priceMin]));
  let priceMax = parseMoney(firstValue(searchParams[FILTER_PARAMS.priceMax]));

  // An inverted range is a fat-fingered range, not an empty collection. Swap it
  // and show the reader what they plainly meant.
  if (priceMin !== null && priceMax !== null && priceMin > priceMax) {
    [priceMin, priceMax] = [priceMax, priceMin];
  }

  const rawStock = firstValue(searchParams[FILTER_PARAMS.inStock]);
  const inStockOnly =
    rawStock !== null && TRUTHY.has(rawStock.trim().toLowerCase());

  return { category, priceMin, priceMax, inStockOnly };
}

export function activeFilterCount(filters: ProductFilters): number {
  let count = 0;
  if (filters.category) count += 1;
  if (filters.priceMin !== null) count += 1;
  if (filters.priceMax !== null) count += 1;
  if (filters.inStockOnly) count += 1;
  return count;
}

export function hasActiveFilters(filters: ProductFilters): boolean {
  return activeFilterCount(filters) > 0;
}

/** Filters to the options object `listProducts()` takes. Omits what is off. */
export function toProductQuery(filters: ProductFilters): ProductFilterQuery {
  const query: ProductFilterQuery = {};
  if (filters.category) query.category = filters.category;
  if (filters.priceMin !== null) query.priceMin = filters.priceMin;
  if (filters.priceMax !== null) query.priceMax = filters.priceMax;
  if (filters.inStockOnly) query.inStockOnly = true;
  return query;
}

/**
 * Build the URL for a given filter set.
 *
 * `base` is the current query string; every param this module does not own
 * (search terms, campaign tags, whatever ships later) is carried through
 * untouched. Chips, pills, the form and the drawer all route through here, so
 * there is exactly one place that knows how a filtered URL is spelled.
 */
export function buildFilterHref(
  filters: ProductFilters,
  base?: FilterSearchParams | URLSearchParams | null,
  pathname = "/",
): string {
  const params = new URLSearchParams();

  if (base instanceof URLSearchParams) {
    base.forEach((value, key) => {
      if (!OWNED_PARAMS.includes(key)) params.append(key, value);
    });
  } else if (base) {
    for (const [key, value] of Object.entries(base)) {
      if (OWNED_PARAMS.includes(key) || value === undefined) continue;
      if (Array.isArray(value)) {
        for (const item of value) params.append(key, item);
      } else {
        params.append(key, value);
      }
    }
  }

  // Fixed order, so the same filter set always spells the same URL — good for
  // caching, for the back button, and for anyone reading the address bar.
  if (filters.category) params.set(FILTER_PARAMS.category, filters.category);
  if (filters.priceMin !== null) {
    params.set(FILTER_PARAMS.priceMin, serialiseMoney(filters.priceMin));
  }
  if (filters.priceMax !== null) {
    params.set(FILTER_PARAMS.priceMax, serialiseMoney(filters.priceMax));
  }
  if (filters.inStockOnly) params.set(FILTER_PARAMS.inStock, "1");

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

/** The params this module does not own, for hidden inputs in a no-JS form. */
export function passthroughParams(
  base: FilterSearchParams | undefined,
): Array<[string, string]> {
  if (!base) return [];
  const pairs: Array<[string, string]> = [];
  for (const [key, value] of Object.entries(base)) {
    if (OWNED_PARAMS.includes(key) || value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) pairs.push([key, item]);
    } else {
      pairs.push([key, value]);
    }
  }
  return pairs;
}

export type FilterChip = {
  /** Stable React key. */
  key: string;
  /** Visible text. The chip renders it mono and uppercase. */
  label: string;
  /** What the grid looks like once this chip is dismissed. */
  next: ProductFilters;
};

/**
 * One chip per active filter, each carrying the filter set it dismisses to.
 * Chips and controls therefore agree by construction, not by discipline.
 */
export function activeFilterChips(
  filters: ProductFilters,
  context: { categories: readonly Category[]; currency: Currency },
): FilterChip[] {
  const chips: FilterChip[] = [];

  if (filters.category) {
    const match = context.categories.find(
      (category) => category.slug === filters.category,
    );
    chips.push({
      key: `category-${filters.category}`,
      label: match ? match.name : filters.category,
      next: { ...filters, category: null },
    });
  }

  if (filters.priceMin !== null) {
    chips.push({
      key: "price-min",
      label: `From ${formatMinor(filters.priceMin, context.currency)}`,
      next: { ...filters, priceMin: null },
    });
  }

  if (filters.priceMax !== null) {
    chips.push({
      key: "price-max",
      label: `Up to ${formatMinor(filters.priceMax, context.currency)}`,
      next: { ...filters, priceMax: null },
    });
  }

  if (filters.inStockOnly) {
    chips.push({
      key: "in-stock",
      label: "In stock only",
      next: { ...filters, inStockOnly: false },
    });
  }

  return chips;
}

/** Major-unit value for a price input, or "" when the bound is unset. */
export function priceInputValue(minor: number | null): string {
  return minor === null ? "" : serialiseMoney(minor);
}
