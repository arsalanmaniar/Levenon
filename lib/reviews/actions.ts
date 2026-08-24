"use server";

import { validateReviewDraft, type ReviewDraft } from "./types";

/**
 * The review submission seam.
 *
 * A Server Action rather than a route handler: the form is already a client
 * component and this keeps the call a function call rather than a hand-rolled
 * `fetch` with its own URL, its own JSON contract, and its own error handling.
 *
 * Everything in this file is safe to call from the browser, because it does
 * nothing. That is the point — the UI is written against the shape the real
 * implementation will have, not so it can be relied on today.
 */

export type PostReviewInput = ReviewDraft & { productSlug: string };

/** Machine-readable failure reasons. The form maps these to brand-voice copy. */
export type PostReviewErrorCode = "invalid" | "rate-limited" | "server";

export type PostReviewResult =
  | { ok: true; status: "pending-moderation" }
  | { ok: false; code: PostReviewErrorCode };

/**
 * STUB — **does not store the review.** Re-validates and returns.
 *
 * The client has already validated; this runs the same rules again because a
 * Server Action is a public HTTP endpoint and anything reaching it may not have
 * come from our form at all. That check is the only real work here.
 *
 * The success status is `pending-moderation`, not `published`, so the copy the
 * shopper reads today is the copy that stays true once the real flow lands.
 *
 * TODO(backend): replace the body. A real implementation needs, at minimum:
 *
 *  1. Persistence — a `reviews` table keyed on the product, written inside a
 *     transaction, storing the submitted text verbatim plus the server's own
 *     timestamp. Never the client's clock, and never the client's `id`.
 *  2. Moderation — the row lands `status = 'pending'` and is invisible to
 *     everyone but its author until a human or a classifier clears it. Nothing
 *     a stranger typed is published to a product page unread. The optimistic
 *     entry the form shows is therefore the author's own view of their own
 *     submission, and the UI copy must keep saying so.
 *  3. Rate limiting — per IP and per account, on a shared store rather than in
 *     process memory, or a single script fills the table overnight.
 *  4. Identity and eligibility — one review per customer per product, enforced
 *     by a unique constraint and not by a UI check, plus a verified-purchase
 *     flag read from the order history. `author` becomes a display name taken
 *     from the session, not a free-text field, the moment there are accounts.
 *  5. Abuse handling — profanity and spam classification, link stripping, a
 *     length ceiling enforced server-side (`BODY_MAX_LENGTH` in ./types is a
 *     client convenience), and an audit trail for anything rejected.
 *  6. Aggregate recomputation — `getAverageRating` reads a seeded array today.
 *     Once rows are real the aggregate must be recomputed (or incremented) when
 *     a review is approved, hidden, or deleted, and the product page revalidated
 *     with `revalidatePath('/product/[id]', 'page')` so the header stars and the
 *     JSON-LD `aggregateRating` do not sit stale behind the 300s ISR window.
 *     Structured data that disagrees with the visible page is a manual action
 *     risk, not just a bug.
 */
export async function postReview(
  input: PostReviewInput,
): Promise<PostReviewResult> {
  const slug = input.productSlug?.trim();
  if (!slug) return { ok: false, code: "invalid" };

  const errors = validateReviewDraft({
    author: input.author ?? "",
    rating: input.rating,
    body: input.body ?? "",
  });
  if (Object.keys(errors).length > 0) return { ok: false, code: "invalid" };

  return { ok: true, status: "pending-moderation" };
}
