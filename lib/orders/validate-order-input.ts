import "server-only";

import { toPakistaniMobile } from "@/lib/orders/orders-data";
import type { CreateOrderInput } from "@/lib/orders/order-store";
import type { CartLine } from "@/lib/cart/types";

type ValidationResult =
  | { ok: true; value: CreateOrderInput }
  | { ok: false; error: string };

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isValidEmail(value: unknown): value is string {
  // Deliberately loose — this is a "did you typo it" check, not RFC 5322
  // validation, matching the level of rigor `isPakistaniMobile` applies to
  // phone numbers elsewhere in this codebase.
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isCartLine(value: unknown): value is CartLine {
  if (typeof value !== "object" || value === null) return false;
  const line = value as Record<string, unknown>;
  return (
    isNonEmptyString(line.variantSku) &&
    isNonEmptyString(line.productId) &&
    isNonEmptyString(line.slug) &&
    isNonEmptyString(line.name) &&
    isNonEmptyString(line.size) &&
    isNonNegativeInteger(line.unitPriceMinor) &&
    (line.currency === "PKR" || line.currency === "USD") &&
    Number.isInteger(line.quantity) &&
    (line.quantity as number) > 0 &&
    isNonNegativeInteger(line.maxQuantity) &&
    (line.imageUrl === null || typeof line.imageUrl === "string")
  );
}

/**
 * Validates a `POST /api/orders` body against the schema the client brief
 * specifies (2026-08-25). Returns the canonicalised value (phone normalised
 * to the 12-digit form every other order lookup in this codebase compares
 * against) rather than the raw input, so nothing downstream re-derives it.
 */
export function validateOrderInput(body: unknown): ValidationResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Request body must be a JSON object" };
  }
  const input = body as Record<string, unknown>;

  const customer = input.customer as Record<string, unknown> | undefined;
  if (typeof customer !== "object" || customer === null) {
    return { ok: false, error: "customer is required" };
  }
  if (!isNonEmptyString(customer.name)) {
    return { ok: false, error: "customer.name is required" };
  }
  const phone = toPakistaniMobile(customer.phone as string | undefined);
  if (!phone) {
    return {
      ok: false,
      error: "customer.phone must be a Pakistani mobile number",
    };
  }
  if (!isValidEmail(customer.email)) {
    return { ok: false, error: "customer.email is invalid" };
  }
  if (!isNonEmptyString(customer.address)) {
    return { ok: false, error: "customer.address is required" };
  }
  if (!isNonEmptyString(customer.city)) {
    return { ok: false, error: "customer.city is required" };
  }

  if (!Array.isArray(input.items) || input.items.length === 0) {
    return { ok: false, error: "items must be a non-empty array" };
  }
  if (!input.items.every(isCartLine)) {
    return { ok: false, error: "one or more items are malformed" };
  }
  const items = input.items as CartLine[];

  if (!isNonNegativeInteger(input.subtotalMinor)) {
    return { ok: false, error: "subtotalMinor must be a non-negative integer" };
  }
  if (!isNonNegativeInteger(input.totalMinor)) {
    return { ok: false, error: "totalMinor must be a non-negative integer" };
  }

  let discount: CreateOrderInput["discount"] = null;
  if (input.discount !== null && input.discount !== undefined) {
    const rawDiscount = input.discount as Record<string, unknown>;
    if (
      !isNonEmptyString(rawDiscount.code) ||
      !isNonNegativeInteger(rawDiscount.amountMinor)
    ) {
      return { ok: false, error: "discount must be null or {code, amountMinor}" };
    }
    discount = {
      code: rawDiscount.code as string,
      amountMinor: rawDiscount.amountMinor as number,
    };
  }

  if (input.currency !== "PKR" && input.currency !== "USD") {
    return { ok: false, error: "currency must be PKR or USD" };
  }

  if (input.paymentMethod !== "card" && input.paymentMethod !== "bank_transfer") {
    return { ok: false, error: "paymentMethod must be card or bank_transfer" };
  }

  return {
    ok: true,
    value: {
      customer: {
        name: (customer.name as string).trim(),
        phone,
        email: (customer.email as string).trim(),
        address: (customer.address as string).trim(),
        city: (customer.city as string).trim(),
      },
      items,
      subtotalMinor: input.subtotalMinor as number,
      discount,
      totalMinor: input.totalMinor as number,
      currency: input.currency,
      paymentMethod: input.paymentMethod,
    },
  };
}
