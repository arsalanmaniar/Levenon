import { normalisePhone } from "@/lib/cart/checkout";

/**
 * Order-tracking utilities: phone canonicalisation and date display.
 *
 * The fixture `Order`/`OrderStatus` types and `lookupOrders()` stub that used
 * to live here were retired (client brief, 2026-08-25) once `/track` moved
 * onto the real order store — see `lib/orders/order-store.ts` for the
 * current `OrderStatus` (five states, not the four this file used to define)
 * and `app/api/orders/route.ts` for the phone-based lookup. What remains
 * below is genuinely shared, not order-shape-specific: phone validation is
 * also used to build the store's own canonical customer key.
 *
 * Money is integer minor units (paisa) everywhere, as in `lib/cart/types.ts`.
 * Never a float, never a formatted string in the data. Display goes through
 * `formatMinor` from that module.
 */

/**
 * Order date for display.
 *
 * Fixed locale and UTC on purpose: the same order must read the same on the
 * server, in the client island, and in a screenshot taken in another timezone.
 */
export function formatOrderDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/**
 * Canonicalises a typed number to a Pakistani mobile, or returns null.
 *
 * The digit stripping is **not** re-implemented here — `normalisePhone()` from
 * `lib/cart/checkout` does it, and this function only decides whether what
 * comes back can be a Pakistani mobile. There is one phone normaliser in this
 * codebase and it lives there.
 *
 * The rule, stated plainly. After `normalisePhone()`, and after removing a
 * dialled IDD `00` prefix, exactly two forms are accepted:
 *
 *   1. International — `92` + `3` + 9 digits  (e.g. `+92 300 1234567`)
 *   2. Local trunk   — `0`  + `3` + 9 digits  (e.g. `0300 1234567`)
 *
 * Both canonicalise to the same 12-digit international form, `923XXXXXXXXX`,
 * so `+92 300 1234567`, `0300-1234567` and `00923001234567` are one customer.
 *
 * Mobiles only. Every Pakistani mobile prefix is `03xx` locally / `3xx`
 * internationally, and this is a small-run shop without a landline, so a
 * landline (`021…`) is rejected rather than quietly accepted and matched
 * against nothing.
 */
export function toPakistaniMobile(raw: string | undefined | null): string | null {
  const digits = normalisePhone(raw);
  if (!digits) return null;

  // `normalisePhone` keeps digits only, and `+92…` and `0092…` are the same
  // intent, so the IDD prefix is dropped here rather than in two regexes.
  const withoutIdd = digits.startsWith("00") ? digits.slice(2) : digits;

  if (/^923\d{9}$/.test(withoutIdd)) return withoutIdd;
  if (/^03\d{9}$/.test(withoutIdd)) return `92${withoutIdd.slice(1)}`;

  return null;
}

/** True when a typed number could be a Pakistani mobile. Drives form copy. */
export function isPakistaniMobile(raw: string | undefined | null): boolean {
  return toPakistaniMobile(raw) !== null;
}
