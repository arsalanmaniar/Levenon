import { NextResponse } from "next/server";
import { addWaitlistEntry } from "@/lib/waitlist/waitlist-store";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidEmail(value: unknown): value is string {
  // Same "did you typo it" level of rigor as `validate-order-input.ts`, not
  // full RFC 5322 validation.
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * POST /api/waitlist — "Notify Me" (client brief, 2026-08-26).
 *
 * Validated the same way `/api/orders` is: a specific 400 reason on a
 * malformed body, not a generic failure.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  if (!isValidEmail(input.email)) {
    return NextResponse.json({ error: "email is invalid" }, { status: 400 });
  }
  if (!isNonEmptyString(input.productId) || !isNonEmptyString(input.productName)) {
    return NextResponse.json(
      { error: "productId and productName are required" },
      { status: 400 },
    );
  }

  const entry = await addWaitlistEntry({
    email: (input.email as string).trim(),
    productId: input.productId,
    productName: input.productName,
  });

  return NextResponse.json({ entry }, { status: 201 });
}
