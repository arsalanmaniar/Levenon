import "server-only";

import { query } from "./connection";
import {
  mapProduct,
  type CategoryRow,
  type MappingIssue,
  type MediaRow,
  type ProductAttributeRow,
  type ProductRow,
  type VariationAttributeRow,
  type VariationRow,
} from "./mapping";
import type { Product } from "@/lib/types";

/**
 * Read-only queries against the Idraak catalogue database.
 *
 * Every statement is parameterised, every statement is a SELECT. This layer
 * never writes to the ERP — the storefront is a reader of someone else's
 * system of record.
 */

const PRODUCT_COLUMNS = `
  p.id, p.supplier_id, p.category_id, p.sku, p.title,
  p.main_description, p.product_description, p.highlights,
  p.quantity, p.base_price, p.recommended_price, p.sale_price,
  p.status, p.deleted_at, p.created_at, p.updated_at
`;

/**
 * The storefront subset.
 *
 * The source table holds 3,662 products across many suppliers — a wholesale
 * marketplace feed, not Levenon's own line. Publishing all of it under the
 * Levenon name would be wrong, so a subset filter is **required**: with none
 * configured, `isSubsetConfigured()` is false and the data layer stays on the
 * static catalogue rather than defaulting to "show everything".
 */
export type SubsetFilter = {
  supplierIds: number[];
  categoryIds: number[];
  skus: string[];
};

function parseIds(value: string | undefined): number[] {
  if (!value) return [];
  return value
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);
}

export function readSubsetFilter(): SubsetFilter {
  return {
    supplierIds: parseIds(process.env.LEVENON_SUPPLIER_IDS),
    categoryIds: parseIds(process.env.LEVENON_CATEGORY_IDS),
    skus: (process.env.LEVENON_SKU_ALLOWLIST ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  };
}

export function isSubsetConfigured(filter = readSubsetFilter()): boolean {
  return (
    filter.supplierIds.length > 0 ||
    filter.categoryIds.length > 0 ||
    filter.skus.length > 0
  );
}

function subsetClause(filter: SubsetFilter): { sql: string; params: unknown[] } {
  const clauses: string[] = [];
  const params: unknown[] = [];

  if (filter.supplierIds.length) {
    clauses.push(`p.supplier_id IN (${filter.supplierIds.map(() => "?").join(",")})`);
    params.push(...filter.supplierIds);
  }
  if (filter.categoryIds.length) {
    clauses.push(`p.category_id IN (${filter.categoryIds.map(() => "?").join(",")})`);
    params.push(...filter.categoryIds);
  }
  if (filter.skus.length) {
    clauses.push(`p.sku IN (${filter.skus.map(() => "?").join(",")})`);
    params.push(...filter.skus);
  }

  // OR: each configured axis widens the subset rather than narrowing it, so a
  // supplier list plus an explicit SKU list means "these suppliers, and also
  // these specific pieces".
  return { sql: clauses.length ? `AND (${clauses.join(" OR ")})` : "", params };
}

/** Only publishable rows: ACTIVE, not soft-deleted, inside the subset. */
function baseWhere(filter: SubsetFilter) {
  const subset = subsetClause(filter);
  return {
    sql: `WHERE p.deleted_at IS NULL AND p.status = 'ACTIVE' ${subset.sql}`,
    params: subset.params,
  };
}

async function hydrate(rows: ProductRow[]): Promise<{
  products: Product[];
  issues: MappingIssue[];
}> {
  if (rows.length === 0) return { products: [], issues: [] };

  const ids = rows.map((row) => row.id);
  const placeholders = ids.map(() => "?").join(",");
  const categoryIds = Array.from(
    new Set(rows.map((r) => r.category_id).filter((id): id is number => Boolean(id))),
  );

  const [variations, attributes, categories, media] = await Promise.all([
    query<VariationRow>(
      `SELECT id, product_id, variant_sku, quantity
         FROM product_variations
        WHERE product_id IN (${placeholders})`,
      ids,
    ),
    query<ProductAttributeRow>(
      `SELECT product_id, attribute_key, attribute_value
         FROM product_attributes
        WHERE product_id IN (${placeholders})`,
      ids,
    ),
    categoryIds.length
      ? query<CategoryRow>(
          `SELECT id, parent_id, name, level, is_leaf
             FROM categories
            WHERE id IN (${categoryIds.map(() => "?").join(",")})`,
          categoryIds,
        )
      : Promise.resolve([]),
    query<MediaRow>(
      `SELECT model_id, file_name, disk, collection_name, order_column
         FROM media
        WHERE model_id IN (${placeholders})
          AND model_type LIKE '%Product'`,
      ids,
    ),
  ]);

  const variationIds = variations.map((v) => v.id);
  const variationAttributes = variationIds.length
    ? await query<VariationAttributeRow>(
        `SELECT product_variation_id, attribute_key, attribute_value
           FROM product_variation_attributes
          WHERE product_variation_id IN (${variationIds.map(() => "?").join(",")})`,
        variationIds,
      )
    : [];

  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const issues: MappingIssue[] = [];

  const products = rows.map((row) => {
    const productVariations = variations.filter((v) => v.product_id === row.id);
    const variationIdSet = new Set(productVariations.map((v) => v.id));

    const mapped = mapProduct({
      row,
      category: row.category_id ? categoryById.get(row.category_id) : null,
      variations: productVariations,
      variationAttributes: variationAttributes.filter((a) =>
        variationIdSet.has(a.product_variation_id),
      ),
      attributes: attributes.filter((a) => a.product_id === row.id),
      media: media.filter((m) => m.model_id === row.id),
    });

    issues.push(...mapped.issues);
    return mapped.product;
  });

  return { products, issues };
}

export async function dbListProducts(options: {
  category?: string;
  query?: string;
  priceMin?: number;
  priceMax?: number;
  inStockOnly?: boolean;
  limit?: number;
}): Promise<{ products: Product[]; issues: MappingIssue[] }> {
  const filter = readSubsetFilter();
  const where = baseWhere(filter);
  const params = [...where.params];
  let sql = `SELECT ${PRODUCT_COLUMNS} FROM products p ${where.sql}`;

  if (options.query) {
    sql += ` AND (p.title LIKE ? OR p.sku LIKE ?)`;
    params.push(`%${options.query}%`, `%${options.query}%`);
  }

  // Category comes in as our derived slug ("shirts-5096"); the trailing id is
  // the real key. Matching on the name would be ambiguous in a 12,500-row tree.
  if (options.category) {
    const categoryId = Number(options.category.split("-").pop());
    if (Number.isInteger(categoryId)) {
      sql += ` AND p.category_id = ?`;
      params.push(categoryId);
    } else {
      // Not a database-shaped slug, so nothing can match. Still issue the query
      // rather than returning early: an early return looks like a successful
      // empty result, which would hide a dead connection instead of letting the
      // caller fall back to the static catalogue.
      sql += ` AND 1 = 0`;
    }
  }

  sql += ` ORDER BY p.updated_at DESC, p.id DESC`;

  if (typeof options.limit === "number") {
    sql += ` LIMIT ?`;
    params.push(Math.max(1, Math.floor(options.limit)));
  } else {
    // Never unbounded: a runaway SELECT against the ERP is not acceptable.
    sql += ` LIMIT 500`;
  }

  const rows = await query<ProductRow>(sql, params);
  const hydrated = await hydrate(rows);

  // Price and stock are filtered after mapping, not in SQL. The source keeps
  // prices in three float columns with a configurable preference, and stock on
  // both products and product_variations — reproducing the adapter's rules in
  // SQL would mean two definitions of the same thing, guaranteed to drift.
  let products = hydrated.products;
  if (typeof options.priceMin === "number") {
    products = products.filter((p) => p.priceMinor >= options.priceMin!);
  }
  if (typeof options.priceMax === "number") {
    products = products.filter((p) => p.priceMinor <= options.priceMax!);
  }
  if (options.inStockOnly) {
    products = products.filter((p) => p.variants.some((v) => v.stockOnHand > 0));
  }

  return { products, issues: hydrated.issues };
}

export async function dbGetProduct(
  idOrSlug: string,
): Promise<{ product: Product | null; issues: MappingIssue[] }> {
  // Slugs are `title-words-<id>`; the id is the lookup key either way.
  const id = Number(idOrSlug.includes("-") ? idOrSlug.split("-").pop() : idOrSlug);
  const parsed = Number.isInteger(id) && id > 0;

  const filter = readSubsetFilter();
  const where = baseWhere(filter);

  // An unparseable handle still runs a query (see the note in dbListProducts):
  // returning early would mask a dead connection as a clean "not found".
  const rows = await query<ProductRow>(
    `SELECT ${PRODUCT_COLUMNS} FROM products p ${where.sql} AND ${
      parsed ? "p.id = ?" : "1 = 0"
    } LIMIT 1`,
    parsed ? [...where.params, id] : where.params,
  );

  const { products, issues } = await hydrate(rows);
  return { product: products[0] ?? null, issues };
}

export async function dbCountProducts(): Promise<number> {
  const filter = readSubsetFilter();
  const where = baseWhere(filter);
  const rows = await query<{ total: number }>(
    `SELECT COUNT(*) AS total FROM products p ${where.sql}`,
    where.params,
  );
  return Number(rows[0]?.total ?? 0);
}
