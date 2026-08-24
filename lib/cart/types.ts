import type { Currency, Product, ProductVariant, Size } from "@/lib/types";

/**
 * A cart line is a **variant**, not a product — you buy a Seam Coat in M, not a
 * Seam Coat. The variant SKU is therefore the line's identity and its React key.
 */
export type CartLine = {
  /** Identity of the line. Unique per product+size. */
  variantSku: string;
  productId: string;
  /** Kept so the drawer can link back without another data fetch. */
  slug: string;
  name: string;
  size: Size;
  /** Integer minor units (paisa). Never a float, never a formatted string. */
  unitPriceMinor: number;
  currency: Currency;
  quantity: number;
  /** Stock ceiling for this variant, captured when the line was created. */
  maxQuantity: number;
  /** First product photo, for the drawer's line-item thumbnail. Null when
   * the product has no photography — the drawer falls back to the ring
   * motif rather than needing the full `visual` variant threaded through. */
  imageUrl: string | null;
};

export type CartTotals = {
  /** Total garments, not lines. */
  itemCount: number;
  subtotalMinor: number;
  /** Null only when the cart is empty — there is no currency to speak of. */
  currency: Currency | null;
};

/** Builds a line from catalogue data. The single place the two shapes meet. */
export function lineFromVariant(
  product: Product,
  variant: ProductVariant,
  quantity = 1,
): CartLine {
  return {
    variantSku: variant.sku,
    productId: product.id,
    slug: product.slug,
    name: product.name,
    size: variant.size,
    unitPriceMinor: product.priceMinor,
    currency: product.currency,
    quantity,
    maxQuantity: variant.stockOnHand,
    imageUrl: product.images[0]?.url ?? null,
  };
}

/**
 * Totals in integer minor units.
 *
 * Mixed currencies are deliberately not summed — a single number across two
 * currencies is always wrong. The reducer refuses to create that state, so this
 * returning the first line's currency is safe; the guard is here as the second
 * lock rather than an assumption.
 */
export function calculateTotals(lines: CartLine[]): CartTotals {
  if (lines.length === 0) {
    return { itemCount: 0, subtotalMinor: 0, currency: null };
  }

  const currency = lines[0].currency;
  let itemCount = 0;
  let subtotalMinor = 0;

  for (const line of lines) {
    itemCount += line.quantity;
    subtotalMinor += line.unitPriceMinor * line.quantity;
  }

  return { itemCount, subtotalMinor, currency };
}

/** Formats integer minor units for display. Mirrors formatPrice in lib/types. */
export function formatMinor(minor: number, currency: Currency): string {
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(minor / 100);
  return `${currency} ${formatted}`;
}
