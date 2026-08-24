import { normalisePhone } from "@/lib/cart/checkout";
import type { Currency, Size } from "@/lib/types";

/**
 * Order tracking — the data layer.
 *
 * This module is the **only** place order shapes and the lookup rule are
 * defined. Components read `Order`/`OrderStatus` and call `lookupOrders()`;
 * none of them know where an order comes from. When the ERP connection lands,
 * the body of `lookupOrders` changes and nothing above it does.
 *
 * Deliberately **not** `server-only`: the tracking form is a client island and
 * calls the stub directly. That is safe today because the fixtures below are
 * invented. It stops being safe the moment real rows are involved — see the
 * TODO(backend) block at the foot of this file, which is where the lookup has
 * to move to.
 *
 * Money is integer minor units (paisa) everywhere, as in `lib/cart/types.ts`.
 * Never a float, never a formatted string in the data. Display goes through
 * `formatMinor` from that module.
 */

/**
 * The four states an order passes through, in order.
 *
 * A closed union, unlike `Size`: these are our own states, not values ingested
 * from a marketplace. The ERP's own status vocabulary will need mapping onto
 * this set rather than widening it — a timeline with an open-ended number of
 * steps is not a timeline.
 */
export type OrderStatus = "Confirmed" | "Processing" | "Dispatched" | "Delivered";

/** Canonical order of the statuses. Drives the timeline; index = progress. */
export const ORDER_STATUS_SEQUENCE: readonly OrderStatus[] = [
  "Confirmed",
  "Processing",
  "Dispatched",
  "Delivered",
];

/** How far through the sequence a status sits. -1 for an unknown value. */
export function statusIndex(status: OrderStatus): number {
  return ORDER_STATUS_SEQUENCE.indexOf(status);
}

/**
 * A line on a placed order.
 *
 * A snapshot, not a reference: name, size and unit price are the values at the
 * moment of purchase. If the catalogue reprices a piece next season, a past
 * order must still show what was paid — so nothing here is looked up live.
 */
export type OrderLine = {
  /** Product name as it was sold. */
  name: string;
  /** Every piece is a length of cloth, so this is "Unstitched" throughout. */
  size: Size;
  quantity: number;
  /** Integer minor units (paisa). Never a float. */
  unitPriceMinor: number;
};

export type Order = {
  /** ERP order reference. Doubles as the human-facing order number. */
  id: string;
  /** ISO-8601 date, `YYYY-MM-DD`. */
  placedAt: string;
  status: OrderStatus;
  lines: OrderLine[];
  /** Integer minor units. Equals the sum of the lines; see `linesTotalMinor`. */
  totalMinor: number;
  currency: Currency;
};

/** Sums an order's lines in minor units. Keeps a total honest. */
export function linesTotalMinor(lines: OrderLine[]): number {
  return lines.reduce(
    (sum, line) => sum + line.unitPriceMinor * line.quantity,
    0,
  );
}

/**
 * Order date for display.
 *
 * Fixed locale and UTC on purpose: the same order must read the same on the
 * server, in the client island, and in a screenshot taken in another timezone.
 */
export function formatOrderDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
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
 * internationally, and orders are placed over WhatsApp, which needs a mobile —
 * a landline (`021…`) is therefore rejected rather than quietly accepted and
 * matched against nothing.
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

/**
 * Fixture orders.
 *
 * Real pieces at real prices from `lib/server/catalogue-data.ts` — a stub that
 * invents products teaches the layout the wrong column widths and hides
 * rounding errors. Three statuses, so the timeline is exercised at three
 * different points.
 *
 * Dates are fixed literals and will age. That is accepted for a stub; they are
 * never computed from `Date.now()`, because a fixture that changes between two
 * renders is worse than one that is merely old.
 */
const FIXTURE_ORDERS: Order[] = [
  {
    id: "LV-26-0812",
    placedAt: "2026-08-12",
    status: "Processing",
    lines: [
      {
        name: "Airjet Lawn Suit",
        size: "Unstitched",
        quantity: 3,
        unitPriceMinor: 322000,
      },
    ],
    totalMinor: 966000,
    currency: "PKR",
  },
  {
    id: "LV-26-0788",
    placedAt: "2026-07-30",
    status: "Dispatched",
    lines: [
      {
        name: "Spengle Net Suit",
        size: "Unstitched",
        quantity: 1,
        unitPriceMinor: 649000,
      },
      {
        name: "Adda Work Chiffon Suit",
        size: "Unstitched",
        quantity: 1,
        unitPriceMinor: 608800,
      },
    ],
    totalMinor: 1257800,
    currency: "PKR",
  },
  {
    id: "LV-26-0731",
    placedAt: "2026-07-06",
    status: "Delivered",
    lines: [
      {
        name: "Monsoon Blooms Chikankari",
        size: "Unstitched",
        quantity: 1,
        unitPriceMinor: 514800,
      },
      {
        name: "Shamoz Silk Suit",
        size: "Unstitched",
        quantity: 2,
        unitPriceMinor: 296200,
      },
    ],
    totalMinor: 1107200,
    currency: "PKR",
  },
];

/**
 * Orders placed from a WhatsApp number. **Stub.**
 *
 * Returns the fixtures above for any number that passes the Pakistani mobile
 * rule, and `[]` for everything else. The number itself is not matched against
 * anything — there is nothing to match it against yet — so callers must not
 * present `[]` as "you have no orders"; the honest reading is "we cannot look
 * this up". The empty state in `components/orders/track-form.tsx` says so.
 *
 * Newest first, which is the order the page renders.
 */
export function lookupOrders(phone: string): Order[] {
  const number = toPakistaniMobile(phone);
  if (!number) return [];

  // Copied out so a caller mutating a line cannot edit the fixture table.
  return FIXTURE_ORDERS.map((order) => ({
    ...order,
    lines: order.lines.map((line) => ({ ...line })),
  }));
}

/* ---------------------------------------------------------------------------
 * TODO(backend) — wiring this to real orders.
 *
 * The database connection is still pending. See "Phase 2 Revisit — Wire Real
 * Database" in `Levenon-Project-Spec.md`: the storefront can already reach
 * MySQL, but no server was reachable from this machine (3306 closed, no client
 * on PATH) and no credentials have been supplied, so nothing here has ever run
 * against live data. `npm run db:check` is the first step once they are.
 *
 * WHERE THE DATA IS
 *   Orders live in the Idraak ERP's `orders` table in `levenon_db` (1,249 rows
 *   at the time of the dump), with lines in the related order-items table and
 *   the buyer in `customers`. The schema conflicts the product adapter already
 *   deals with apply again: money is stored as decimal strings in major units
 *   and must be converted to integer minor units on the **string** form, and
 *   the ERP's own status vocabulary has to be mapped onto the four values of
 *   `OrderStatus` — mismatches reported, never silently coerced. Supplier and
 *   internal-cost columns must never be selected.
 *
 * HOW LOOKUP WORKS
 *   By customer phone. Normalise the stored number the same way this module
 *   does (`normalisePhone` → `toPakistaniMobile`) and compare canonical
 *   12-digit forms; do not compare raw strings, because the ERP holds a mix of
 *   `03…`, `+92…` and `92…`. Index the canonical column, or the lookup is a
 *   full table scan on every submit.
 *
 * THIS MUST NOT EXPOSE OTHER CUSTOMERS DATA
 *   A phone number is a weak authenticator. It is guessable, it is printed on
 *   every parcel, and it is shared across a household — so a bare
 *   phone-to-orders endpoint is an enumeration oracle over names, addresses and
 *   spend. Before real rows are returned:
 *     - authenticate the number, do not merely accept it. Either an OTP sent to
 *       that WhatsApp number and exchanged for a short-lived session, or a
 *       signed, expiring link ("track this order") sent in the order
 *       confirmation message. Nothing weaker than one of those two.
 *     - move the lookup to the server (route handler or server action). This
 *       module is imported by a client component today; a real query must not
 *       be.
 *     - rate-limit per IP and per number, and return the same response shape
 *       and the same timing for "no orders" as for "not your number", so the
 *       endpoint cannot be used to test whether a number is a customer.
 *     - scope the query to the authenticated number in the SQL itself, and
 *       never accept an order id from the client as the only selector.
 *     - return only what the page renders. No email, no address, no internal
 *       notes, no cost price.
 * ------------------------------------------------------------------------- */
