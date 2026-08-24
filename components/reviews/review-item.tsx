import { StarRating } from "./stars";
import { formatReviewDate, type Review } from "@/lib/reviews/types";

/**
 * One review, as content only.
 *
 * No `<li>` of its own, and no `"use client"`. Both matter: the interactive
 * list wraps some rows in `m.li` for the entrance and the rest in a plain one,
 * and the page renders this same component inside the Suspense fallback so the
 * reviews are in the static HTML for a crawler and for a reader with no
 * JavaScript. One presentation, three call sites.
 */
export function ReviewItem({ review }: { review: Review }) {
  return (
    <article>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <StarRating value={review.rating} size="md" />
        <p className="label text-ink">{review.author}</p>
        <time dateTime={review.createdAt} className="label text-charcoal">
          {formatReviewDate(review.createdAt)}
        </time>
      </div>
      <p className="mt-5 max-w-measure text-base leading-relaxed text-charcoal">
        {review.body}
      </p>
    </article>
  );
}

/**
 * The row separator, in one place.
 *
 * A hairline rule *between* reviews rather than a box around each: the list is
 * a sequence, not a set of cards. Lives here so the interactive list and the
 * static fallback cannot drift apart by a padding step.
 */
export const REVIEW_ROW = "border-t border-hairline py-10 first:border-t-0 first:pt-0";
