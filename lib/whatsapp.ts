/**
 * WhatsApp configuration — the single source of truth for the shop number and
 * for every pre-filled message the site can open.
 *
 * Before this existed the number was read in three different ways (a helper in
 * `lib/cart/checkout.ts`, a raw `process.env` read inside
 * `whatsapp-checkout.tsx`, and a separate development placeholder constant in
 * `whatsapp-float.tsx`), which is exactly how a shop ends up half-migrated when
 * the number changes. There is now one constant and one resolver; everything
 * else imports from here.
 *
 * ---------------------------------------------------------------------------
 * TO CHANGE THE NUMBER: edit `DEFAULT_WHATSAPP_NUMBER` below, or set
 * `NEXT_PUBLIC_WHATSAPP_NUMBER` in the environment, which wins. Nothing else in
 * the codebase needs touching.
 * ---------------------------------------------------------------------------
 */

/**
 * The shop's WhatsApp number in the international form `wa.me` requires:
 * country code first, digits only, no `+`, spaces, dashes or parentheses.
 *
 * Supplied directly in this form: `923142200737`. Replaced in full from the
 * previous number, not appended alongside it — every entry point resolves
 * through `getShopWhatsAppNumber()` below, so this one edit is the whole
 * change.
 */
export const DEFAULT_WHATSAPP_NUMBER = "923142200737";

/**
 * Reduces a number to the digits `wa.me` expects. Returns null for anything
 * that cannot be a phone number, so callers can render a fallback rather than
 * linking to `wa.me/undefined`.
 */
export function normalisePhone(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  // Shortest plausible international number is ~8 digits; longest E.164 is 15.
  if (digits.length < 8 || digits.length > 15) return null;
  return digits;
}

/**
 * The configured shop number.
 *
 * `NEXT_PUBLIC_WHATSAPP_NUMBER` is read as a literal so Next can inline it at
 * build time — a computed `process.env[...]` lookup would silently be undefined
 * in the browser. It overrides the default when set, which is how a deployment
 * points at a different number without a code change. Public by necessity: the
 * deep link is built client-side and the number appears in the URL the customer
 * opens anyway.
 */
export function getShopWhatsAppNumber(): string | null {
  return (
    normalisePhone(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER) ??
    normalisePhone(DEFAULT_WHATSAPP_NUMBER)
  );
}

/**
 * Builds a `wa.me` deep link with a URL-encoded pre-filled message.
 * Null when no usable number is configured.
 */
export function buildWhatsAppUrl(
  phone: string | undefined | null,
  message: string,
): string | null {
  const number = normalisePhone(phone);
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/** Convenience: link for the configured shop number. */
export function shopWhatsAppUrl(message: string): string | null {
  return buildWhatsAppUrl(getShopWhatsAppNumber(), message);
}

/*
 * Message templates.
 *
 * Kept together so the shop's voice stays consistent across the floating
 * button, the product page and the contact page, and so none of them drift into
 * sounding like a bot. Each one opens by naming the shop, because the customer
 * is starting a thread the owner will read out of context.
 */

/** Generic support opener — the floating button and the contact page. */
export const SUPPORT_MESSAGE =
  "Hi Levenon, I have a question about your products.";

/** Product-page enquiry. */
export function productEnquiryMessage(productName: string): string {
  return `Hi Levenon, I'm interested in ${productName}. Is it available?`;
}

/**
 * Order-tracking enquiry, used when `/track` finds nothing.
 *
 * Deliberately does not claim the order is missing — the lookup is a stub and
 * no real order table has been asked. It says the customer placed an order and
 * wants to know where it is, which is the only thing actually known.
 */
export const ORDER_TRACKING_MESSAGE = [
  "Hi Levenon, I placed an order from this number",
  "and would like to know where it is.",
].join(" ");

/** Accessible label shared by every WhatsApp control on the site. */
export const WHATSAPP_ARIA_LABEL = "Chat with Levenon on WhatsApp";
