import { isInStock, type Product } from "@/lib/types";

/**
 * Scoring for the Style Finder quiz (client brief, 2026-08-31, "1 amazing
 * new feature"). There is no "occasion" or "style" field on the catalogue
 * schema (see `lib/types.ts`) — an occasion/style quiz has to map onto what
 * the catalogue actually has: category and price. This is a best-effort
 * preference matcher, not a claimed recommendation engine; it is presented
 * to the shopper as "picks for you", never as data-backed personalisation.
 */

export type Occasion = "daily" | "formal" | "wedding" | "work";
export type FabricPreference = "airy" | "heavy" | "between";
export type StylePreference = "minimal" | "embroidered" | "bold" | "classic";
export type Budget = "under4000" | "mid" | "above6000";

export type StyleFinderSelections = {
  occasion: Occasion;
  fabric: FabricPreference;
  style: StylePreference;
  budget: Budget;
};

const OCCASION_CATEGORIES: Record<Occasion, string[]> = {
  daily: ["lawn", "cotton"],
  formal: ["chiffon", "silk"],
  wedding: ["silk", "organza", "net"],
  work: ["cotton", "lawn"],
};

const FABRIC_CATEGORIES: Record<FabricPreference, string[]> = {
  airy: ["lawn", "cotton", "chiffon"],
  heavy: ["silk", "organza", "net"],
  between: ["chiffon", "organza"],
};

const STYLE_KEYWORDS: Record<StylePreference, string[]> = {
  minimal: ["minimal", "plain", "solid", "understated"],
  embroidered: ["embroidery", "embroidered", "hand", "adda", "chikankari", "kiran", "cutwork"],
  bold: ["print", "printed", "bold", "digital"],
  classic: ["classic", "timeless", "traditional"],
};

/** Inclusive minor-unit bounds. `Infinity` is fine here — it's never serialised. */
const BUDGET_RANGE: Record<Budget, [number, number]> = {
  under4000: [0, 400000],
  mid: [400000, 600000],
  above6000: [600000, Infinity],
};

function scoreProduct(product: Product, selections: StyleFinderSelections): number {
  let score = 0;
  if (OCCASION_CATEGORIES[selections.occasion].includes(product.category.slug)) score += 2;
  if (FABRIC_CATEGORIES[selections.fabric].includes(product.category.slug)) score += 2;

  const text = `${product.name} ${product.blurb} ${product.description.join(" ")}`.toLowerCase();
  if (STYLE_KEYWORDS[selections.style].some((keyword) => text.includes(keyword))) score += 1;

  return score;
}

/**
 * Picks the four best-matching in-stock products for a set of quiz answers.
 * Budget is a hard filter first; if fewer than four pieces fall inside it
 * (a real possibility on a ~24-piece catalogue) it widens to the full
 * in-stock catalogue rather than returning an emptier result than the quiz
 * promised.
 */
export function matchProducts(products: Product[], selections: StyleFinderSelections): Product[] {
  const inStock = products.filter(isInStock);
  const [min, max] = BUDGET_RANGE[selections.budget];
  const withinBudget = inStock.filter((product) => product.priceMinor >= min && product.priceMinor <= max);
  const pool = withinBudget.length >= 4 ? withinBudget : inStock;

  return [...pool]
    .sort((a, b) => scoreProduct(b, selections) - scoreProduct(a, selections) || a.name.localeCompare(b.name))
    .slice(0, 4);
}
