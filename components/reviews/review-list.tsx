"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { m } from "framer-motion";
import { REVIEW_ROW, ReviewItem } from "./review-item";
import { ReviewForm } from "./review-form";
import { useReviewSession } from "./review-session";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import {
  DEFAULT_REVIEW_SORT,
  REVIEW_SORT_PARAM,
  REVIEW_SORTS,
  parseReviewSort,
  sortReviews,
  type Review,
  type ReviewSort,
} from "@/lib/reviews/types";
import { cn } from "@/lib/cn";

// Brand entrance: rise + fade, expo-out. Never scale, never blur.
const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * The reviews a reader can sort, and the form that adds to them.
 *
 * **Rows arrive as a prop.** `lib/reviews/reviews-data.ts` is `server-only`, so
 * the page reads it and hands this component one product's reviews; the whole
 * table never crosses to the browser.
 *
 * Sort state lives in `?reviews=recent|highest|lowest`, read with
 * `useSearchParams` and written with `router.replace(..., { scroll: false })`.
 * Deliberately not read through the page's `searchParams` prop: touching that
 * would make `/product/[id]` dynamic, and this route is prerendered with
 * `dynamicParams = false` and a 300s revalidate. A sort order is not worth
 * giving up static rendering of every product page.
 *
 * The consequence is that `useSearchParams` forces this subtree to render on
 * the client, which is why the page wraps it in `<Suspense>` — and why that
 * fallback is a fully rendered static copy of the same list rather than a
 * spinner. A crawler and a reader without JavaScript still get the reviews.
 */
export function ReviewList({
  reviews,
  productSlug,
}: {
  reviews: Review[];
  productSlug: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const reducedMotion = usePrefersReducedMotion();

  const sort = parseReviewSort(searchParams.get(REVIEW_SORT_PARAM));

  /*
   * Rows come from the shared session, not from local state: the header rating
   * above reads the same array, so the count there and the count here cannot
   * disagree. `reviews` is still the prop the server passed — the provider was
   * seeded with it.
   */
  const { all, postedIds, add, remove } = useReviewSession();
  const rows = useMemo(() => sortReviews(all, sort), [all, sort]);

  const selectSort = useCallback(
    (next: ReviewSort) => {
      const params = new URLSearchParams(searchParams.toString());
      // The default is the absence of the param — a clean URL for the state
      // the page already shows, and every other param carried through.
      if (next === DEFAULT_REVIEW_SORT) params.delete(REVIEW_SORT_PARAM);
      else params.set(REVIEW_SORT_PARAM, next);

      const query = params.toString();
      // `replace`, not `push`: re-sorting a list is not a place in history, and
      // `scroll: false` keeps the reader where they were reading.
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  return (
    <div className="mt-12">
      {rows.length > 0 ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
            <div
              role="group"
              aria-label="Sort reviews"
              className="flex flex-wrap items-center gap-2"
            >
              {REVIEW_SORTS.map((option) => {
                const active = option.value === sort;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => selectSort(option.value)}
                    className={cn(
                      "label inline-flex min-h-[44px] items-center rounded-full border px-5",
                      "transition-colors duration-200 ease-state",
                      active
                        ? "border-purple-500 text-purple-500"
                        : "border-hairline text-charcoal hover:border-purple-500 hover:text-purple-500",
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <p className="label text-charcoal">
              {rows.length} {rows.length === 1 ? "review" : "reviews"}
            </p>
          </div>

          <ol className="mt-12">
            {rows.map((review) =>
              postedIds.has(review.id) && !reducedMotion ? (
                // Only a review posted in this session animates in, and only
                // when motion is welcome. Under reduced motion the branch is
                // not taken at all, so no animation is constructed.
                <m.li
                  key={review.id}
                  className={REVIEW_ROW}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: EASE }}
                >
                  <ReviewItem review={review} />
                </m.li>
              ) : (
                <li key={review.id} className={REVIEW_ROW}>
                  <ReviewItem review={review} />
                </li>
              ),
            )}
          </ol>
        </>
      ) : (
        <p className="max-w-measure text-base leading-relaxed text-charcoal">
          No reviews for this piece yet. If you have had it cut and stitched,
          the first note is yours to write.
        </p>
      )}

      <div className="mt-16 border-t border-hairline pt-16">
        <h3 className="font-display text-2xl font-extrabold tracking-[-0.02em]">
          Write a review
        </h3>
        <p className="mt-4 max-w-measure text-base leading-relaxed text-charcoal">
          How much cloth came, how it stitched up, how the colour reads in
          daylight. That is what the next buyer needs.
        </p>
        <div className="mt-8">
          <ReviewForm
            productSlug={productSlug}
            onPost={add}
            onRollback={remove}
          />
        </div>
      </div>
    </div>
  );
}
