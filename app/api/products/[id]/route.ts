import { NextResponse } from "next/server";
import { getProduct } from "@/lib/server/products";

/**
 * GET /api/products/:id — accepts the product id or its slug.
 *
 * 200 → { product: Product }
 * 404 → { error: "Product not found" }
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const product = await getProduct(params.id);

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({ product });
}
