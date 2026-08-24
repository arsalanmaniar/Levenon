/**
 * Reviews — the shared contract.
 *
 * Deliberately **not** `server-only`. The seed data in `reviews-data.ts` is
 * import-guarded so the whole review table never reaches the browser, but the
 * *shape* of a review, the sort order, and the validation rules are needed on
 * both sides of the wire: the list and the form are client components, and the
 * server action has to re-check what the form checked. Two copies of a length
 * rule drift, and the copy on the wrong side of the wire is the one that
 * rejects a real customer — so there is one copy, here, and it is pure.
 *
 * The same split `lib/filters.ts` makes for the same reason.
 */

/** Whole stars only. Half stars exist for *averages*, never for a submission. */
export type Rating = 1 | 2 | 3 | 4 | 5;

export type Review = {
  /** Stable key. Seeded rows use `rv-<slug>-<n>`; optimistic ones `local-…`. */
  id: string;
  productSlug: string;
  author: string;
  rating: Rating;
  body: string;
  /** ISO 8601, UTC. Stored as a string so the module stays serialisable. */
  createdAt: string;
};

/** What the product header and the JSON-LD aggregate both read. */
export type RatingSummary = {
  /** Mean rating rounded to one decimal. `0` when there are no reviews. */
  average: number;
  count: number;
};

/* -------------------------------------------------------------------------
 * Sort — state lives in the URL, the way filter state does.
 * ---------------------------------------------------------------------- */

/** `?reviews=recent|highest|lowest`. Namespaced so it cannot collide. */
export const REVIEW_SORT_PARAM = "reviews";

export type ReviewSort = "recent" | "highest" | "lowest";

export const DEFAULT_REVIEW_SORT: ReviewSort = "recent";

/** Pill order, and the only place the visible labels are spelled. */
export const REVIEW_SORTS: ReadonlyArray<{ value: ReviewSort; label: string }> = [
  { value: "recent", label: "Most recent" },
  { value: "highest", label: "Highest rated" },
  { value: "lowest", label: "Lowest rated" },
];

/** Anything unrecognised degrades to the default rather than to an error. */
export function parseReviewSort(raw: string | null | undefined): ReviewSort {
  const value = raw?.trim().toLowerCase();
  return REVIEW_SORTS.some((option) => option.value === value)
    ? (value as ReviewSort)
    : DEFAULT_REVIEW_SORT;
}

function newestFirst(a: Review, b: Review): number {
  return Date.parse(b.createdAt) - Date.parse(a.createdAt);
}

/**
 * Pure and stable: copies before sorting, never mutates the argument, and ties
 * on rating fall through to newest-first so the order is fully determined.
 * Two calls with the same input always produce the same output — which is what
 * lets the server render one order and the client re-render another without
 * anything jumping for reasons the reader cannot see.
 */
export function sortReviews(
  reviews: readonly Review[],
  sort: ReviewSort = DEFAULT_REVIEW_SORT,
): Review[] {
  const rows = [...reviews];
  if (sort === "highest") {
    return rows.sort((a, b) => b.rating - a.rating || newestFirst(a, b));
  }
  if (sort === "lowest") {
    return rows.sort((a, b) => a.rating - b.rating || newestFirst(a, b));
  }
  return rows.sort(newestFirst);
}

/* -------------------------------------------------------------------------
 * Dates
 * ---------------------------------------------------------------------- */

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

/**
 * "12 March 2026".
 *
 * Hand-rolled rather than `Intl.DateTimeFormat`: this string is produced during
 * the server render and again at hydration, and the two runtimes do not have to
 * agree on ICU data or on a local timezone. Reading UTC parts of a UTC stamp is
 * the same answer everywhere, so the markup matches and React stays quiet.
 */
export function formatReviewDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/* -------------------------------------------------------------------------
 * Validation — one definition, used by the form and by the server action.
 * ---------------------------------------------------------------------- */

export const AUTHOR_MAX_LENGTH = 60;
export const BODY_MIN_LENGTH = 20;
export const BODY_MAX_LENGTH = 1200;

/** What the form collects. The slug is added when it is posted. */
export type ReviewDraft = {
  author: string;
  /** `0` means "not chosen yet" — the picker's empty state. */
  rating: number;
  body: string;
};

export type ReviewField = keyof ReviewDraft;

/** Field name to message. An empty object means the draft is postable. */
export type ReviewErrors = Partial<Record<ReviewField, string>>;

export function isRating(value: number): value is Rating {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

/**
 * Every message names the next action. "Invalid input" tells the reader
 * nothing they can do something about.
 */
export function validateReviewDraft(draft: ReviewDraft): ReviewErrors {
  const errors: ReviewErrors = {};

  const author = draft.author.trim();
  if (author.length === 0) errors.author = "Add the name this should be signed with";
  else if (author.length > AUTHOR_MAX_LENGTH) {
    errors.author = `Keep the name under ${AUTHOR_MAX_LENGTH} characters`;
  }

  if (!isRating(draft.rating)) errors.rating = "Choose a rating, one star to five";

  const body = draft.body.trim();
  if (body.length === 0) errors.body = "Write a line about how the cloth turned out";
  else if (body.length < BODY_MIN_LENGTH) {
    errors.body = `A little more — ${BODY_MIN_LENGTH} characters at least`;
  } else if (body.length > BODY_MAX_LENGTH) {
    errors.body = `Trim it to ${BODY_MAX_LENGTH} characters or fewer`;
  }

  return errors;
}
