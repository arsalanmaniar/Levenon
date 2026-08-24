import type { CartLine, CartTotals } from "./types";
import { formatMinor } from "./types";
import { summariseOrder, type DiscountCode } from "./discount";

/**
 * Checkout module — the extension point.
 *
 * Today there is exactly one channel: a pre-filled WhatsApp message. When COD or
 * an online gateway is added, they become further functions here that consume
 * the same `CartLine[]`/`CartTotals`. Nothing about the cart, the drawer, or the
 * product page needs to change to add one — that is the whole point of keeping
 * message building out of the components.
 */

export type OrderDraft = {
  lines: CartLine[];
  totals: CartTotals;
  /**
   * Applied discount code, if the customer entered one. Optional so every
   * existing caller keeps working unchanged.
   */
  discount?: DiscountCode | null;
  /** Optional note from the customer. Not collected yet; the field is ready. */
  note?: string;
};

/**
 * The human-readable order, as sent to WhatsApp.
 *
 * Plain text on purpose: WhatsApp's formatting is unreliable across clients and
 * a shop owner reading this on a phone wants something they can copy line by
 * line into whatever they use to record orders.
 */
export function buildOrderMessage({
  lines,
  totals,
  discount,
  note,
}: OrderDraft): string {
  if (lines.length === 0) {
    return "Levenon — empty order.";
  }

  const itemLines = lines.map((line, index) => {
    const lineTotal = formatMinor(
      line.unitPriceMinor * line.quantity,
      line.currency,
    );
    return [
      `${index + 1}. ${line.name} — size ${line.size} × ${line.quantity}`,
      `   ${line.variantSku} · ${lineTotal}`,
    ].join("\n");
  });

  const garments = totals.itemCount === 1 ? "1 piece" : `${totals.itemCount} pieces`;
  const summary = summariseOrder(totals, discount ?? null);
  const money = (minor: number) =>
    summary.currency ? formatMinor(minor, summary.currency) : "—";

  /*
   * With no code the message keeps its original single-total shape — the shop
   * owner reads these on a phone and an unnecessary breakdown is noise.
   *
   * With a code the arithmetic is shown in full, and that is deliberate: the
   * discount is applied in the browser (see lib/cart/discount.ts), so the owner
   * is the one who validates it. They cannot do that from a net figure alone —
   * they need the gross, the code, and what it took off.
   */
  const totalLines =
    summary.discountMinor > 0 && summary.discount
      ? [
          `Subtotal: ${money(summary.subtotalMinor)} (${garments})`,
          `Discount ${summary.discount.code} (${summary.discount.label}): -${money(summary.discountMinor)}`,
          ...(summary.discount.condition
            ? [`   Condition to check: ${summary.discount.condition}`]
            : []),
          `Total: ${money(summary.totalMinor)}`,
        ]
      : [`Total: ${money(summary.totalMinor)} (${garments})`];

  const parts = [
    "Hi Levenon, I would like to place an order.",
    "",
    "Order:",
    ...itemLines,
    "",
    ...totalLines,
  ];

  if (note?.trim()) {
    parts.push("", `Note: ${note.trim()}`);
  }

  parts.push("", "Please confirm my order.");

  return parts.join("\n");
}

/*
 * The number, the link builder and the phone normaliser used to live here.
 * They now live in `lib/whatsapp.ts`, which is the single place the shop's
 * number is configured — this module is about turning a cart into a *message*,
 * which is a separate concern from which account that message is addressed to.
 *
 * Re-exported so existing importers keep working and there is still exactly one
 * implementation behind them.
 */
export {
  buildWhatsAppUrl,
  getShopWhatsAppNumber,
  normalisePhone,
} from "@/lib/whatsapp";
