import { NextResponse } from "next/server";
import { listProducts } from "@/lib/server/products";

/**
 * GET /api/products
 *
 * Query params:
 *   category   category slug, e.g. "outerwear"
 *   q          free-text match on name, blurb, SKU
 *   priceMin   inclusive lower bound, integer minor units
 *   priceMax   inclusive upper bound, integer minor units
 *   inStock    "1"/"true" to drop pieces with no stock in any size
 *   limit      positive integer
 *
 * 200 → { products: Product[], count: number }
 * 400 → { error: string } for a malformed limit
 *
 * Server Components read the data layer directly rather than calling this
 * route — an app should not HTTP-fetch itself. This exists for client-side
 * callers (filtering, Phase 3's cart) and for anything external.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  const rawLimit = params.get("limit");
  let limit: number | undefined;
  if (rawLimit !== null) {
    limit = Number(rawLimit);
    if (!Number.isInteger(limit) || limit < 1) {
      return NextResponse.json(
        { error: "limit must be a positive integer" },
        { status: 400 },
      );
    }
  }

  const price = (name: string) => {
    const raw = params.get(name);
    if (raw === null) return { value: undefined as number | undefined, bad: false };
    const value = Number(raw);
    // Prices are integer minor units everywhere; a float here means the caller
    // is working in rupees and would silently filter by 1/100th of the range.
    if (!Number.isInteger(value) || value < 0) return { value: undefined, bad: true };
    return { value, bad: false };
  };

  const priceMin = price("priceMin");
  const priceMax = price("priceMax");
  if (priceMin.bad || priceMax.bad) {
    return NextResponse.json(
      { error: "priceMin/priceMax must be non-negative integers in minor units" },
      { status: 400 },
    );
  }

  const inStockRaw = params.get("inStock");
  const inStockOnly = inStockRaw === "1" || inStockRaw === "true";

  const products = await listProducts({
    category: params.get("category") ?? undefined,
    query: params.get("q") ?? undefined,
    priceMin: priceMin.value,
    priceMax: priceMax.value,
    inStockOnly,
    limit,
  });

  return NextResponse.json({ products, count: products.length });
}
