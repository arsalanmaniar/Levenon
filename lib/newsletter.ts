/**
 * Newsletter — client-side contract only.
 *
 * Phase 1 ships the form and its validation. Nothing here talks to a network,
 * a database, or storage, and the address the reader types is never persisted.
 * `subscribeToNewsletter` exists so the UI is written against the shape the
 * real implementation will have, not so it can be called today.
 */

/** RFC 5321 caps a full address at 254 characters. Used for `maxLength` too. */
export const EMAIL_MAX_LENGTH = 254;

/*
 * Deliberately loose: local-part, "@", domain, a dot, a TLD of two or more —
 * no whitespace anywhere. Address syntax is far wider than any regex people
 * actually ship, and a strict pattern's failure mode is rejecting a real
 * customer. This catches the typo cases ("name", "name@", "name@host") and
 * leaves everything else to the confirmation email, which is the only honest
 * test of whether an address exists.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * The one definition of "is this an email". The form and any future server
 * handler must both use this — two copies drift, and the copy on the wrong
 * side of the wire is the one that rejects a valid address.
 *
 * Trims first, so leading/trailing whitespace from a paste is not an error.
 */
export function isValidEmail(email: string): boolean {
  const trimmed = email.trim();
  if (trimmed.length === 0 || trimmed.length > EMAIL_MAX_LENGTH) return false;
  return EMAIL_PATTERN.test(trimmed);
}

/** Machine-readable failure reasons. The UI maps these to brand-voice copy. */
export type NewsletterErrorCode =
  | "invalid-email"
  | "already-subscribed"
  | "rate-limited"
  | "network"
  | "server";

export type SubscribeResult =
  | { ok: true; status: "confirmation-sent" }
  | { ok: false; code: NewsletterErrorCode };

/**
 * STUB — does not subscribe anybody. Resolves against local validation only.
 *
 * TODO(backend): replace the body. A real implementation needs:
 *
 *  1. Endpoint — POST to a route handler (`app/api/newsletter/route.ts`) that
 *     holds the provider credential server-side. The provider key must never
 *     reach the client, so this function stays a thin `fetch` to our own
 *     origin and the provider call happens on the server.
 *  2. Double opt-in — the POST creates a *pending* subscriber and sends a
 *     confirmation mail with a single-use, expiring token. The list is only
 *     joined when that token is redeemed (`/newsletter/confirm?token=...`).
 *     Hence the success status here is `confirmation-sent`, not `subscribed`,
 *     and the UI copy must not claim the reader is subscribed outright.
 *  3. Error shape — the route returns this same discriminated union as JSON so
 *     the client never parses prose. Note `already-subscribed` should be
 *     answered as a success to the client (or with generic copy) to avoid
 *     leaking whether an address is on the list. Network/parse failures map to
 *     `network`; any non-2xx without a recognised body maps to `server`.
 *  4. Rate limiting — per IP and per address, on the route handler (e.g. 5
 *     attempts / 10 minutes / IP). Without it this endpoint is a free mail
 *     cannon aimed at arbitrary inboxes. Exceeded → `rate-limited`, HTTP 429.
 *  5. Also on the server: revalidate the address with `isValidEmail`, normalise
 *     case on the domain, record consent (timestamp + source page) for GDPR,
 *     and include an unsubscribe link in every send.
 */
export async function subscribeToNewsletter(
  email: string,
): Promise<SubscribeResult> {
  if (!isValidEmail(email)) return { ok: false, code: "invalid-email" };
  return { ok: true, status: "confirmation-sent" };
}
