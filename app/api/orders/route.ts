import { NextResponse } from "next/server";
import { createOrder, getOrdersByPhone } from "@/lib/orders/order-store";
import { validateOrderInput } from "@/lib/orders/validate-order-input";
import { toPakistaniMobile } from "@/lib/orders/orders-data";

/**
 * POST /api/orders — places an order (client brief, 2026-08-25).
 *
 * Validates the full body against the schema in `validate-order-input.ts`,
 * generates the id and `createdAt`, sets `status: "pending"`, and appends it
 * to the interim JSON store. 201 with the created order on success, 400 with
 * a specific reason on a malformed body.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validation = validateOrderInput(body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const order = await createOrder(validation.value);
  return NextResponse.json({ order }, { status: 201 });
}

/**
 * GET /api/orders?phone= — every order placed from a phone number.
 *
 * Not one of the two routes the brief names literally (only `POST /api/orders`
 * and `GET /api/orders/[id]` are), but a necessary addition: `/track`'s
 * existing UI asks a customer for their phone number, not an order id they
 * would have no reason to have memorised, and rebuilding that page's whole
 * interaction model was out of scope for wiring it to real data. Same
 * disclosed caveat as `lib/orders/orders-data.ts`'s retired lookup: a phone
 * number is a weak authenticator, and this must not ship to a real launch
 * without the OTP/signed-link work described there.
 */
export async function GET(request: Request) {
  const phone = new URL(request.url).searchParams.get("phone");
  const canonical = toPakistaniMobile(phone);
  if (!canonical) {
    return NextResponse.json(
      { error: "phone must be a Pakistani mobile number" },
      { status: 400 },
    );
  }

  const orders = await getOrdersByPhone(canonical);
  return NextResponse.json({ orders });
}
