import "server-only";

import { CATEGORIES, PRODUCTS, SEASON } from "./catalogue-data";
import { isDatabaseConfigured } from "./db/connection";
import {
  dbCountProducts,
  dbGetProduct,
  dbListProducts,
  isSubsetConfigured,
} from "./db/catalogue-queries";
import { isInStock, type CollectionSummary, type Category, type Product } from "@/lib/types";

/**
 * The product data access layer — the single seam between Levenon and storage.
 *
 * Two sources sit behind it:
 *   database — the Idraak MySQL catalogue, when both a connection **and** a
 *              subset filter are configured (see db/catalogue-queries.ts for
 *              why the subset is mandatory rather than optional);
 *   static   — lib/server/catalogue-data.ts, the typed fallback.
 *
 * Callers above this file are unchanged and unaware of which is active. If a
 * database read fails, we fall back to the static catalogue and log loudly
 * rather than showing an empty shop.
 */

export type CatalogueSource = "database" | "static";

export function activeSource(): CatalogueSource {
  return isDatabaseConfigured() && isSubsetConfigured() ? "database" : "static";
}

/** One-line explanation of the current source, for diagnostics and scripts. */
export function describeSource(): string {
  if (!isDatabaseConfigured()) return "static (no LEVENON_DB_* configured)";
  if (!isSubsetConfigured()) {
    return "static (database configured but no subset filter — refusing to publish the full ERP catalogue)";
  }
  return "database";
}

function reportIssues(context: string, issues: { field: string; detail: string; productId: number }[]) {
  if (issues.length === 0) return;
  // Grouped so 500 rows with the same synthesised-variant note produce one line.
  const byField = new Map<string, number>();
  for (const issue of issues) {
    byField.set(issue.field, (byField.get(issue.field) ?? 0) + 1);
  }
  const summary = Array.from(byField.entries())
    .map(([field, count]) => `${field}×${count}`)
    .join(", ");
  console.warn(`[catalogue] ${context}: mapping issues — ${summary}`);
}

export type ListProductsOptions = {
  /** Category slug. Unknown slugs yield an empty list. */
  category?: string;
  /** Case-insensitive match against name, blurb, and SKU. */
  query?: string;
  /** Include archived rows. Defaults to false — storefront reads active only. */
  includeArchived?: boolean;
  /** Inclusive price bounds, in integer minor units — same as `priceMinor`. */
  priceMin?: number;
  priceMax?: number;
  /** Drop pieces with no stock in any size. Stock lives on the variant. */
  inStockOnly?: boolean;
  limit?: number;
};

function isVisible(product: Product, includeArchived: boolean) {
  return includeArchived || product.status === "active";
}

function listStatic(options: ListProductsOptions): Product[] {
  const {
    category,
    query,
    includeArchived = false,
    priceMin,
    priceMax,
    inStockOnly,
    limit,
  } = options;

  let rows = PRODUCTS.filter((product) => isVisible(product, includeArchived));

  if (category) {
    rows = rows.filter((product) => product.category.slug === category);
  }

  if (typeof priceMin === "number") {
    rows = rows.filter((product) => product.priceMinor >= priceMin);
  }
  if (typeof priceMax === "number") {
    rows = rows.filter((product) => product.priceMinor <= priceMax);
  }
  if (inStockOnly) {
    rows = rows.filter(isInStock);
  }

  if (query) {
    const needle = query.trim().toLowerCase();
    if (needle) {
      rows = rows.filter((product) =>
        [product.name, product.blurb, product.sku].some((field) =>
          field.toLowerCase().includes(needle),
        ),
      );
    }
  }

  rows = [...rows].sort(
    (a, b) =>
      a.category.sortOrder - b.category.sortOrder || a.name.localeCompare(b.name),
  );

  return typeof limit === "number" ? rows.slice(0, Math.max(0, limit)) : rows;
}

export async function listProducts(
  options: ListProductsOptions = {},
): Promise<Product[]> {
  if (activeSource() === "database") {
    try {
      const { products, issues } = await dbListProducts(options);
      reportIssues("listProducts", issues);
      return products;
    } catch (error) {
      console.error("[catalogue] database read failed, using static:", error);
    }
  }
  return listStatic(options);
}

/** Accepts either the id or the slug. */
export async function getProduct(idOrSlug: string): Promise<Product | null> {
  if (activeSource() === "database") {
    try {
      const { product, issues } = await dbGetProduct(idOrSlug);
      reportIssues(`getProduct(${idOrSlug})`, issues);
      return product;
    } catch (error) {
      console.error("[catalogue] database read failed, using static:", error);
    }
  }

  const key = idOrSlug.toLowerCase();
  return (
    PRODUCTS.find(
      (product) =>
        product.status === "active" &&
        (product.id.toLowerCase() === key || product.slug.toLowerCase() === key),
    ) ?? null
  );
}

export async function listCategories(): Promise<Category[]> {
  if (activeSource() === "database") {
    try {
      // Derived from the products actually on sale rather than the source's
      // 12,500-row taxonomy, almost none of which is reachable here.
      const products = await listProducts();
      const seen = new Map<string, Category>();
      for (const product of products) {
        if (!seen.has(product.category.slug)) {
          seen.set(product.category.slug, product.category);
        }
      }
      return Array.from(seen.values()).sort(
        (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
      );
    } catch (error) {
      console.error("[catalogue] category read failed, using static:", error);
    }
  }
  return CATEGORIES;
}

export async function getCollectionSummary(): Promise<CollectionSummary> {
  if (activeSource() === "database") {
    try {
      return { season: SEASON, pieceCount: await dbCountProducts() };
    } catch (error) {
      console.error("[catalogue] count failed, using static:", error);
    }
  }
  const active = PRODUCTS.filter((product) => product.status === "active");
  return { season: SEASON, pieceCount: active.length };
}
