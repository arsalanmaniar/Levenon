/**
 * Levenon product schema (Phase 2).
 *
 * This is the real shape now — the API in app/api/products returns exactly
 * these objects, and every component reads them. Two deliberate choices:
 *
 * - Money is stored and passed as integer minor units (paisa). Floats do not
 *   belong anywhere near a price.
 * - Stock lives on the variant, not the product. A garment is in stock in a
 *   size, not in general; `inStock` on a product is derived, never stored.
 */

export type Currency = "PKR" | "USD";

/**
 * Sizes are free text, not a closed union.
 *
 * The catalogue database stores size as an EAV attribute (`size_or_storage`)
 * with values the marketplace ingest produced: "Standard", "Small", "N/A",
 * "S, M, L", "Un-stitched", "Int: One size". A union of XS–XL cannot represent
 * that, and coercing real values into it would silently lose data. Known sizes
 * still sort canonically via SIZE_ORDER; anything else sorts after them.
 */
export type Size = string;

/** Canonical sizes, smallest to largest. Drives chip order where they appear. */
export const SIZE_ORDER: readonly string[] = ["XS", "S", "M", "L", "XL"];

/** Known sizes first in canonical order, then everything else alphabetically. */
export function compareSizes(a: Size, b: Size): number {
  const ia = SIZE_ORDER.indexOf(a);
  const ib = SIZE_ORDER.indexOf(b);
  if (ia !== -1 && ib !== -1) return ia - ib;
  if (ia !== -1) return -1;
  if (ib !== -1) return 1;
  return a.localeCompare(b);
}

export type Category = {
  id: string;
  slug: string;
  name: string;
  /** One-line mono caption used on category headers. */
  tagline: string | null;
  sortOrder: number;
};

export type ProductVariant = {
  id: string;
  productId: string;
  size: Size;
  /** Per-variant SKU — this is the unit that is actually counted and sold. */
  sku: string;
  stockOnHand: number;
};

/**
 * Placeholder line art used until real photography exists. When images land,
 * `images` becomes non-empty and the visual is ignored — the card and the
 * detail page already prefer images when present.
 */
export type VisualVariant = "ring" | "stitch" | "knot" | "seam";

export type ProductImage = {
  url: string;
  alt: string;
  width: number;
  height: number;
};

export type Product = {
  id: string;
  /** URL segment. Stable, human-readable, never reused. */
  slug: string;
  /** Style-level SKU. Variant SKUs extend this with the size. */
  sku: string;
  name: string;
  category: Category;
  priceMinor: number;
  currency: Currency;
  /** Short card line, tailoring-literate. */
  blurb: string;
  /** Full copy for the detail page. Paragraphs, already split. */
  description: string[];
  /** Composition / origin rows, rendered as a mono spec table. */
  specs: Array<{ label: string; value: string }>;
  variants: ProductVariant[];
  images: ProductImage[];
  visual: VisualVariant;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
};

/** Summary counters for the hero eyebrow and the signature section stat. */
export type CollectionSummary = {
  season: string;
  pieceCount: number;
};

// --- derived helpers -------------------------------------------------------
// Kept here so the grid, the card, and the detail page all agree on what
// "in stock" and "sizes" mean.

export function availableSizes(product: Product): Size[] {
  return product.variants
    .filter((variant) => variant.stockOnHand > 0)
    .map((variant) => variant.size)
    .sort(compareSizes);
}

export function allSizes(product: Product): Size[] {
  return product.variants
    .map((variant) => variant.size)
    .sort(compareSizes);
}

export function isInStock(product: Product): boolean {
  return product.variants.some((variant) => variant.stockOnHand > 0);
}

export function formatPrice(product: Pick<Product, "priceMinor" | "currency">) {
  const major = product.priceMinor / 100;
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(major);
  return `${product.currency} ${formatted}`;
}
