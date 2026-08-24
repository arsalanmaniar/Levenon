import type { Currency } from "@/lib/types";
import type { CartTotals } from "./types";

/**
 * Discount codes — client-side only, by design and with eyes open.
 *
 * There is no backend to validate against, so the code table below ships in the
 * browser bundle and anyone can read it. **That is acceptable only because these
 * are public promotional codes** — the kind printed on a flyer. It would not be
 * acceptable for per-customer codes, single-use codes, or anything with a
 * monetary cap, all of which can be forged by editing the client state.
 *
 * The real protection is elsewhere and already exists: nothing here charges a
 * card. Checkout hands a WhatsApp message to the shop owner, who sees the code
 * and the arithmetic in the message and can refuse it. When a real gateway
 * lands, **the discount must be re-validated server-side before payment** — a
 * client-side price is a suggestion, never a fact.
 *
 * Replacing the table with a fetch later means changing `findDiscount` and
 * nothing else; everything downstream consumes the resolved object.
 */

export type DiscountCode = {
  /** Canonical, uppercase. What the customer typed is normalised to this. */
  code: string;
  /** Whole percent off the subtotal. Integer — no fractional percentages. */
  percentOff: number;
  /** Mono-friendly summary, e.g. "10% off". */
  label: string;
  /** Extra condition shown to the customer. Not enforced — see the note below. */
  condition?: string;
};

/**
 * The table.
 *
 * `LAUNCH20` is documented as first-order only, and **that condition is not
 * enforced** — with no accounts and no order history in the browser there is
 * nothing to check it against. It is surfaced as text so the customer and the
 * shop owner both see the claim, and the owner can decline it in the chat. Do
 * not add conditions here that read as enforced when they are not.
 */
const CODES: readonly DiscountCode[] = [
  { code: "LEVENON10", percentOff: 10, label: "10% off" },
  { code: "LAUNCH20", percentOff: 20, label: "20% off", condition: "First order" },
  { code: "THREAD15", percentOff: 15, label: "15% off" },
];

/**
 * Resolves raw customer input to a code, or null.
 *
 * Trims and uppercases, so "  levenon10 " matches. Whitespace inside is
 * stripped too — people paste codes with a trailing space more often than they
 * mistype them.
 */
export function findDiscount(raw: string | null | undefined): DiscountCode | null {
  if (!raw) return null;
  const normalised = raw.replace(/\s+/g, "").toUpperCase();
  if (!normalised) return null;
  return CODES.find((entry) => entry.code === normalised) ?? null;
}

/** Every code, for anywhere that needs to list them. Copy, not the original. */
export function listDiscounts(): DiscountCode[] {
  return [...CODES];
}

/**
 * What the customer owes, broken into its parts.
 *
 * `deliveryMinor` is present and always zero. There is no delivery line yet —
 * shipping is settled in the WhatsApp conversation — but the field exists so
 * that adding one later is a value change rather than a restructure, and so the
 * rule "**the discount applies to the subtotal, never to delivery**" is written
 * into the shape instead of living in someone's memory.
 */
export type OrderSummary = {
  subtotalMinor: number;
  /** Amount removed. Always >= 0, never larger than the subtotal. */
  discountMinor: number;
  deliveryMinor: number;
  totalMinor: number;
  currency: Currency | null;
  discount: DiscountCode | null;
};

/** One rupee, in minor units. Discounts are quantised to this. */
const MINOR_PER_MAJOR = 100;

/**
 * Applies a code to cart totals. Pure; safe to call on every render.
 *
 * All arithmetic stays in integer minor units — there is no float anywhere in
 * the chain, and no `toFixed` parsing.
 *
 * **The discount is rounded to a whole rupee, and that is deliberate.** Ten per
 * cent of PKR 5,148 is PKR 514.80, which would leave a total of PKR 4,633.20 —
 * and `formatMinor` renders with `maximumFractionDigits: 0`, so the drawer and
 * the WhatsApp message would both display "PKR 4,633" while the underlying
 * number said something else. A shop owner reconciling the message against the
 * bag would find a 20-paisa hole with no way to explain it. Quantising to the
 * rupee keeps every figure the customer and the owner see exactly equal to the
 * figure the code computed. Rounding is to nearest, so it can favour the
 * customer by at most half a rupee — the right direction to err in.
 *
 * Paisa are not in practical circulation in Pakistan, so nothing is lost.
 */
export function summariseOrder(
  totals: CartTotals,
  discount: DiscountCode | null,
): OrderSummary {
  const subtotalMinor = totals.subtotalMinor;
  const deliveryMinor = 0;

  const rawDiscount = discount
    ? Math.round((subtotalMinor * discount.percentOff) / 100 / MINOR_PER_MAJOR) *
      MINOR_PER_MAJOR
    : 0;

  // A discount can never exceed the subtotal or turn a total negative, however
  // the table is edited later.
  const discountMinor = Math.min(Math.max(rawDiscount, 0), subtotalMinor);

  return {
    subtotalMinor,
    discountMinor,
    deliveryMinor,
    totalMinor: subtotalMinor - discountMinor + deliveryMinor,
    currency: totals.currency,
    discount: discountMinor > 0 ? discount : null,
  };
}

/** Outcome of the customer pressing Apply. Drives the inline feedback. */
export type ApplyResult =
  | { status: "applied"; discount: DiscountCode }
  | { status: "already"; discount: DiscountCode }
  | { status: "unknown" }
  | { status: "empty" };

/**
 * Decides what applying `raw` should do, given what is already applied.
 *
 * Kept out of the component so the idempotency rule — applying the same code
 * twice changes nothing — is testable and stated once.
 */
export function applyDiscount(
  raw: string,
  current: DiscountCode | null,
): ApplyResult {
  if (!raw.trim()) return { status: "empty" };

  const found = findDiscount(raw);
  if (!found) return { status: "unknown" };

  if (current && current.code === found.code) {
    return { status: "already", discount: current };
  }

  return { status: "applied", discount: found };
}
