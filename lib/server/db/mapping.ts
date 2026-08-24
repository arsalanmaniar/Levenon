import "server-only";

import type { Category, Product, ProductVariant, VisualVariant } from "@/lib/types";

/**
 * Adapter: Idraak/`levenon_db` rows → Levenon's `Product` shape.
 *
 * Our shape wins (confirmed decision). Every mismatch between the two models is
 * resolved here, explicitly, in one file — and anything that cannot be resolved
 * cleanly is *reported*, never silently coerced. Callers collect
 * `MappingIssue[]` and surface them rather than shipping quiet wrong data.
 *
 * The functions are pure so they can be tested against rows lifted straight out
 * of LevenonIdraak.sql without a database.
 */

// --- row shapes (exactly what the SQL returns) ------------------------------

export type ProductRow = {
  id: number;
  supplier_id: number;
  category_id: number | null;
  sku: string;
  title: string;
  main_description: string | null;
  product_description: string | null;
  highlights: string | null;
  quantity: number;
  /** double(8,2) / decimal(10,2) — returned as strings, see connection.ts. */
  base_price: string | number | null;
  recommended_price: string | number | null;
  sale_price: string | number | null;
  status: string;
  deleted_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type VariationRow = {
  id: number;
  product_id: number;
  variant_sku: string;
  quantity: number;
};

export type VariationAttributeRow = {
  product_variation_id: number;
  attribute_key: string;
  attribute_value: string | null;
};

export type ProductAttributeRow = {
  product_id: number;
  attribute_key: string;
  attribute_value: string | null;
};

export type CategoryRow = {
  id: number;
  parent_id: number | null;
  name: string;
  level: number;
  is_leaf: number;
};

export type MediaRow = {
  model_id: number;
  file_name: string;
  disk: string;
  collection_name: string;
  order_column: number | null;
};

// --- issue reporting --------------------------------------------------------

export type MappingIssue = {
  productId: number;
  field: string;
  detail: string;
};

// --- money ------------------------------------------------------------------

/**
 * Price resolution. The database has **three** price columns and no currency.
 *
 * Order: `sale_price` (what the customer pays when set) → `recommended_price`
 * → `base_price`. `purchase_price` on variations is supplier cost and is never
 * read here — it must not reach a client bundle.
 *
 * Conversion to integer minor units is done on the *string* form, so a value
 * like "1234.56" becomes 123456 exactly. Parsing to a JS float first is how
 * 1234.56 * 100 becomes 123455.99999999999.
 */
export function toMinorUnits(
  raw: string | number | null | undefined,
): { minor: number | null; issue?: string } {
  if (raw === null || raw === undefined) return { minor: null };

  const text = String(raw).trim();
  if (text === "") return { minor: null };

  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(text);
  if (!match) return { minor: null, issue: `unparseable price "${text}"` };

  const [, sign, whole, fraction = ""] = match;
  const padded = (fraction + "00").slice(0, 2);
  const minor = Number(`${sign}${whole}${padded}`);

  if (!Number.isSafeInteger(minor)) {
    return { minor: null, issue: `price out of safe integer range: ${text}` };
  }
  if (fraction.length > 2) {
    return { minor, issue: `price ${text} has more than 2 decimals — truncated` };
  }
  return { minor };
}

export type PriceColumn = "sale_price" | "recommended_price" | "base_price";

const DEFAULT_PRICE_ORDER: PriceColumn[] = [
  "sale_price",
  "recommended_price",
  "base_price",
];

/**
 * Which column the customer pays from, in preference order.
 *
 * Configured with `LEVENON_PRICE_COLUMN` (a single column, or a comma-separated
 * fallback chain). This is a **business decision, not a technical one** — in the
 * sampled data `recommended_price` (3361.00) is *lower* than `base_price`
 * (3399.00), so the choice changes what every customer is charged. The default
 * chain is preserved until that call is made explicitly.
 */
export function readPriceOrder(): PriceColumn[] {
  const raw = process.env.LEVENON_PRICE_COLUMN;
  if (!raw) return DEFAULT_PRICE_ORDER;

  const requested = raw
    .split(",")
    .map((part) => part.trim())
    .filter((part): part is PriceColumn =>
      DEFAULT_PRICE_ORDER.includes(part as PriceColumn),
    );

  if (requested.length === 0) return DEFAULT_PRICE_ORDER;

  // Anything not named still acts as a last-resort fallback, so a product with
  // only base_price set never falls through to a price of zero.
  const rest = DEFAULT_PRICE_ORDER.filter((column) => !requested.includes(column));
  return [...requested, ...rest];
}

export function resolvePrice(
  row: ProductRow,
  order: PriceColumn[] = readPriceOrder(),
): {
  priceMinor: number;
  issues: string[];
} {
  const issues: string[] = [];
  const byColumn: Record<PriceColumn, string | number | null> = {
    sale_price: row.sale_price,
    recommended_price: row.recommended_price,
    base_price: row.base_price,
  };
  const candidates: Array<[string, string | number | null]> = order.map((column) => [
    column,
    byColumn[column],
  ]);

  for (const [column, value] of candidates) {
    const { minor, issue } = toMinorUnits(value);
    if (issue) issues.push(`${column}: ${issue}`);
    if (minor !== null && minor > 0) return { priceMinor: minor, issues };
  }

  issues.push(`no positive price in ${order.join(" → ")}`);
  return { priceMinor: 0, issues };
}

// --- text -------------------------------------------------------------------

const TAG = /<[^>]*>/g;
const WHITESPACE = /\s+/g;

export function stripHtml(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(TAG, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+/g, " ")
    .trim();
}

export function toParagraphs(value: string | null | undefined): string[] {
  return stripHtml(value)
    .split(/\n{1,}/)
    .map((line) => line.replace(WHITESPACE, " ").trim())
    .filter((line) => line.length > 0);
}

/** Card blurb: the database has no short field, so take the first sentence. */
export function toBlurb(row: ProductRow, maxLength = 140): string {
  const text = stripHtml(row.main_description ?? row.product_description);
  if (!text) return "";
  const sentence = text.split(/(?<=[.!?])\s/)[0] ?? text;
  const clean = sentence.replace(WHITESPACE, " ").trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 1).trimEnd()}…`;
}

// --- identity ---------------------------------------------------------------

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * The database has no slug column and `title` carries no uniqueness guarantee,
 * so the row id is appended. That keeps URLs stable, unique, and reversible
 * without adding a column to someone else's schema.
 */
export function buildSlug(row: ProductRow, maxWords = 8): string {
  const base = slugify(row.title).split("-").filter(Boolean).slice(0, maxWords).join("-");
  return base ? `${base}-${row.id}` : `product-${row.id}`;
}

const VISUALS: VisualVariant[] = ["ring", "stitch", "knot", "seam"];

/** Deterministic placeholder art until photography exists for a row. */
export function pickVisual(id: number): VisualVariant {
  return VISUALS[id % VISUALS.length];
}

// --- category ---------------------------------------------------------------

/**
 * The ERP's category tree is the Daraz taxonomy: 12,500 rows, no slug, no
 * tagline, no sort order, and `products.category_id` is nullable. Uncategorised
 * products get a real placeholder rather than being dropped.
 */
export const UNCATEGORISED: Category = {
  id: "uncategorised",
  slug: "uncategorised",
  name: "Uncategorised",
  tagline: null,
  sortOrder: 9999,
};

export function mapCategory(row: CategoryRow | undefined | null): Category {
  if (!row) return UNCATEGORISED;
  return {
    id: String(row.id),
    slug: `${slugify(row.name)}-${row.id}`,
    name: row.name,
    // No tagline column exists in the source.
    tagline: null,
    // No sort column either; the tree's depth is the only ordering signal.
    sortOrder: row.level,
  };
}

// --- variants ---------------------------------------------------------------

const SIZE_KEYS = new Set(["size_or_storage", "size"]);
const COLOR_KEYS = new Set(["color", "color_family"]);

/** Values that mean "this product has no real size axis". */
const NON_SIZES = new Set([
  "",
  "n/a",
  "na",
  "not specified",
  "standard",
  "single price",
  "single size",
  "int: one size",
  "one size",
  "size",
]);

export function normaliseSize(raw: string | null | undefined): string {
  const value = (raw ?? "").trim();
  if (NON_SIZES.has(value.toLowerCase())) return "One size";

  // Canonical short sizes arrive in many casings.
  const upper = value.toUpperCase();
  if (/^(XS|S|M|L|XL|XXL|2XL|3XL)$/.test(upper)) return upper;
  return value;
}

/**
 * Builds variant rows.
 *
 * Most products in the source have **no** `product_variations` rows at all, but
 * the storefront cart is keyed on variant SKU with per-variant stock. Rather
 * than break the cart, a single synthetic "One size" variant is derived from
 * `products.quantity` and the style SKU — and the caller is told, because a
 * synthesised variant is an assumption, not data.
 */
export function mapVariants(
  row: ProductRow,
  variations: VariationRow[],
  attributes: VariationAttributeRow[],
): { variants: ProductVariant[]; issues: string[] } {
  const issues: string[] = [];
  const productId = String(row.id);

  if (variations.length === 0) {
    issues.push(
      `no product_variations rows — synthesised one variant from products.quantity (${row.quantity})`,
    );
    return {
      variants: [
        {
          id: `${productId}-default`,
          productId,
          size: "One size",
          sku: row.sku,
          stockOnHand: Math.max(0, row.quantity ?? 0),
        },
      ],
      issues,
    };
  }

  const byVariation = new Map<number, VariationAttributeRow[]>();
  for (const attribute of attributes) {
    const list = byVariation.get(attribute.product_variation_id) ?? [];
    list.push(attribute);
    byVariation.set(attribute.product_variation_id, list);
  }

  const variants = variations.map((variation) => {
    const attrs = byVariation.get(variation.id) ?? [];
    const sizeAttr = attrs.find((a) => SIZE_KEYS.has(a.attribute_key.toLowerCase()));
    const colorAttr = attrs.find((a) => COLOR_KEYS.has(a.attribute_key.toLowerCase()));

    const size = normaliseSize(sizeAttr?.attribute_value);

    // Colour is a second variant axis our schema has no field for. Folding it
    // into the size label keeps variants distinguishable instead of collapsing
    // five colourways into five identical "One size" chips.
    const label = colorAttr?.attribute_value?.trim()
      ? size === "One size"
        ? colorAttr.attribute_value.trim()
        : `${size} · ${colorAttr.attribute_value.trim()}`
      : size;

    return {
      id: String(variation.id),
      productId,
      size: label,
      sku: variation.variant_sku,
      stockOnHand: Math.max(0, variation.quantity ?? 0),
    } satisfies ProductVariant;
  });

  const productStock = row.quantity ?? 0;
  const variantStock = variants.reduce((sum, v) => sum + v.stockOnHand, 0);
  if (productStock > 0 && variantStock !== productStock) {
    issues.push(
      `stock disagreement: products.quantity=${productStock} vs Σ variations=${variantStock} — variant figures used`,
    );
  }

  return { variants, issues };
}

// --- specs & images ---------------------------------------------------------

/**
 * EAV attributes worth showing. Everything else in `product_attributes` is
 * marketplace plumbing (`daraz`, `normal`, delivery flags) or commercially
 * sensitive, and is excluded by omission rather than by blocklist.
 */
const SPEC_KEYS: Array<[key: string, label: string]> = [
  ["brand", "Brand"],
  ["material", "Material"],
  ["fabric", "Fabric"],
  ["color_family", "Colour"],
  ["warranty_type", "Warranty"],
  ["model", "Model"],
];

export function mapSpecs(attributes: ProductAttributeRow[]): Product["specs"] {
  const found = new Map<string, string>();
  for (const attribute of attributes) {
    const key = attribute.attribute_key.toLowerCase();
    const value = (attribute.attribute_value ?? "").trim();
    if (value && !found.has(key)) found.set(key, value);
  }

  return SPEC_KEYS.filter(([key]) => found.has(key)).map(([key, label]) => ({
    label,
    value: stripHtml(found.get(key)!).slice(0, 120),
  }));
}

/**
 * Media rows are Spatie Media Library records; the file lives on a disk, not at
 * a URL. `LEVENON_MEDIA_BASE_URL` supplies the origin (the dump references
 * `idraak-dev.s3.ap-southeast-1.amazonaws.com/levenon/Products/...`). Without
 * it, no images are emitted and the thread-motif placeholder is used instead of
 * a broken <img>.
 */
export function mapImages(rows: MediaRow[], productName: string): Product["images"] {
  const base = process.env.LEVENON_MEDIA_BASE_URL?.replace(/\/$/, "");
  if (!base) return [];

  return [...rows]
    .sort((a, b) => (a.order_column ?? 0) - (b.order_column ?? 0))
    .map((row) => ({
      url: `${base}/${row.model_id}/${encodeURIComponent(row.file_name)}`,
      alt: productName,
      width: 1000,
      height: 1250,
    }));
}

// --- status -----------------------------------------------------------------

/**
 * Source status is a six-value pipeline enum. Only ACTIVE is publishable; the
 * four `*_PENDING` states mean the row is mid-ingest and incomplete, which is
 * exactly what should not appear on a storefront.
 */
export function mapStatus(row: ProductRow): Product["status"] {
  if (row.deleted_at) return "archived";
  return row.status === "ACTIVE" ? "active" : "archived";
}

// --- assembly ---------------------------------------------------------------

export type MapProductInput = {
  row: ProductRow;
  category?: CategoryRow | null;
  variations?: VariationRow[];
  variationAttributes?: VariationAttributeRow[];
  attributes?: ProductAttributeRow[];
  media?: MediaRow[];
};

export function mapProduct(input: MapProductInput): {
  product: Product;
  issues: MappingIssue[];
} {
  const { row } = input;
  const issues: MappingIssue[] = [];
  const note = (field: string, detail: string) =>
    issues.push({ productId: row.id, field, detail });

  const { priceMinor, issues: priceIssues } = resolvePrice(row);
  priceIssues.forEach((detail) => note("priceMinor", detail));

  const { variants, issues: variantIssues } = mapVariants(
    row,
    input.variations ?? [],
    input.variationAttributes ?? [],
  );
  variantIssues.forEach((detail) => note("variants", detail));

  if (!row.category_id) note("category", "products.category_id is NULL");

  const blurb = toBlurb(row);
  if (!blurb) note("blurb", "no description text to derive a blurb from");

  const description = toParagraphs(row.product_description ?? row.main_description);
  if (description.length === 0) note("description", "empty after HTML stripping");

  const product: Product = {
    id: String(row.id),
    slug: buildSlug(row),
    sku: row.sku,
    name: row.title,
    category: mapCategory(input.category),
    priceMinor,
    // No currency column exists in the source; Daraz payloads in the same
    // database are all PKR.
    currency: "PKR",
    blurb,
    description,
    specs: mapSpecs(input.attributes ?? []),
    variants,
    images: mapImages(input.media ?? [], row.title),
    visual: pickVisual(row.id),
    status: mapStatus(row),
    createdAt: row.created_at ?? new Date(0).toISOString(),
    updatedAt: row.updated_at ?? new Date(0).toISOString(),
  };

  return { product, issues };
}
