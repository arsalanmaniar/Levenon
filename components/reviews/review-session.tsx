"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { StarRating } from "./stars";
import type { Review } from "@/lib/reviews/types";

/**
 * One source of truth for "what reviews does this page currently show".
 *
 * The header rating and the list are far apart in the tree — the header sits in
 * the product summary, the list is a whole section below it and behind its own
 * `Suspense` boundary. When a review was posted only the list knew about it, so
 * the list said six and the header still said five. Two numbers describing the
 * same thing, disagreeing on screen.
 *
 * The provider wraps both, so the count and the average are derived once from
 * one array. **The average is recomputed from the merged reviews, not adjusted
 * from the server's rounded figure** — nudging a value already rounded to one
 * decimal accumulates error, and the exact arithmetic is no harder.
 *
 * Server-rendered children pass straight through: wrapping them in a client
 * provider does not make them client components.
 */

type ReviewSessionValue = {
  /** Server rows plus anything posted this session, newest posted first. */
  all: Review[];
  /** Ids posted in this session — the list animates only these. */
  postedIds: Set<string>;
  count: number;
  /** Mean rating to one decimal. 0 when there are none. */
  average: number;
  add: (review: Review) => void;
  remove: (id: string) => void;
};

const ReviewSessionContext = createContext<ReviewSessionValue | null>(null);

export function ReviewSessionProvider({
  reviews,
  children,
}: {
  reviews: Review[];
  children: ReactNode;
}) {
  const [posted, setPosted] = useState<Review[]>([]);

  const add = useCallback(
    (review: Review) => setPosted((previous) => [review, ...previous]),
    [],
  );

  // Rollback for a failed post. Without it an optimistic update becomes a lie
  // the moment the action stops being a stub.
  const remove = useCallback(
    (id: string) =>
      setPosted((previous) => previous.filter((review) => review.id !== id)),
    [],
  );

  const value = useMemo<ReviewSessionValue>(() => {
    const all = [...posted, ...reviews];
    const count = all.length;
    const total = all.reduce((sum, review) => sum + review.rating, 0);
    return {
      all,
      postedIds: new Set(posted.map((review) => review.id)),
      count,
      average: count === 0 ? 0 : Math.round((total / count) * 10) / 10,
      add,
      remove,
    };
  }, [posted, reviews, add, remove]);

  return (
    <ReviewSessionContext.Provider value={value}>
      {children}
    </ReviewSessionContext.Provider>
  );
}

export function useReviewSession(): ReviewSessionValue {
  const context = useContext(ReviewSessionContext);
  if (!context) {
    throw new Error(
      "useReviewSession must be used inside <ReviewSessionProvider>",
    );
  }
  return context;
}

/**
 * The rating, wherever it appears. Both call sites read the same numbers, so
 * they cannot drift apart again.
 *
 * Renders nothing at all when there are no reviews — "0 reviews" beside a price
 * reads as a verdict on the piece rather than as an absence of evidence.
 */
export function LiveRating({ variant }: { variant: "header" | "section" }) {
  const { average, count } = useReviewSession();
  if (count === 0) return null;

  if (variant === "section") {
    return (
      <p className="flex items-center gap-3">
        <StarRating value={average} size="sm" />
        <span className="label text-ink">{average} out of 5</span>
      </p>
    );
  }

  return (
    <a href="#reviews" className="group inline-flex min-h-[44px] items-center gap-2.5">
      <StarRating value={average} size="sm" />
      <span className="label text-charcoal transition-colors duration-200 ease-state group-hover:text-purple-500">
        ({count} {count === 1 ? "review" : "reviews"})
      </span>
    </a>
  );
}
