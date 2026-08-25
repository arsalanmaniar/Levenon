import { NextResponse } from "next/server";
import { getOrderById } from "@/lib/orders/order-store";

/**
 * GET /api/orders/[id] — a single order by id (client brief, 2026-08-25).
 *
 * The checkout success page reads the store directly (Server Component —
 * see the note in `/api/products/route.ts` on why server code doesn't fetch
 * its own API), so this route exists for client-side callers: the fallback
 * poll if a checkout redirect ever needs to confirm an order landed, and any
 * future external caller.
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const order = await getOrderById(params.id);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  return NextResponse.json({ order });
}
