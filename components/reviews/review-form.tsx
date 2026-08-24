"use client";

import { useId, useRef, useState } from "react";
import { StarGlyph } from "./stars";
import { postReview } from "@/lib/reviews/actions";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import {
  AUTHOR_MAX_LENGTH,
  BODY_MAX_LENGTH,
  BODY_MIN_LENGTH,
  isRating,
  validateReviewDraft,
  type Review,
  type ReviewErrors,
  type ReviewField,
} from "@/lib/reviews/types";
import { cn } from "@/lib/cn";

/*
 * Hints, and the errors that replace them. Each line names the next action —
 * "invalid input" tells the reader nothing they can do something about. Same
 * construction as the newsletter form: the line is always in the DOM and always
 * the field's description, so `aria-describedby` never points somewhere else.
 */
const AUTHOR_HINT = "The name this is signed with";
const RATING_HINT = "One star to five";
const BODY_HINT = `${BODY_MIN_LENGTH} characters or more`;

type Status = "idle" | "posting" | "posted" | "failed";

const STARS = [1, 2, 3, 4, 5] as const;

/**
 * Write a review.
 *
 * Optimistic: the review is handed to the list the moment it validates, before
 * `postReview` is awaited, so the reader sees their own words on the page
 * rather than a spinner. If the post fails it is handed straight back — an
 * optimistic update with no rollback is just a lie with better timing.
 *
 * The rating is five real buttons. Not a number input, not a select: a rating
 * is a choice among five things, and a spinbutton makes the reader type a
 * number to say something they can point at. Each is 44px, each carries its own
 * accessible name, and Tab walks them in order.
 */
export function ReviewForm({
  productSlug,
  onPost,
  onRollback,
}: {
  productSlug: string;
  /** Show this review immediately, at its place in the current sort. */
  onPost: (review: Review) => void;
  /** Take it back off again — the post did not land. */
  onRollback: (id: string) => void;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const id = useId().replace(/:/g, "");
  const authorId = `review-author-${id}`;
  const authorHintId = `${authorId}-hint`;
  const ratingLabelId = `review-rating-${id}`;
  const ratingHintId = `${ratingLabelId}-hint`;
  const bodyId = `review-body-${id}`;
  const bodyHintId = `${bodyId}-hint`;
  const statusId = `review-status-${id}`;

  const [author, setAuthor] = useState("");
  const [rating, setRating] = useState(0);
  const [preview, setPreview] = useState(0);
  const [body, setBody] = useState("");
  const [errors, setErrors] = useState<ReviewErrors>({});
  const [status, setStatus] = useState<Status>("idle");

  const authorRef = useRef<HTMLInputElement>(null);
  const ratingRef = useRef<HTMLButtonElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);

  /** An error about what was typed a moment ago is noise once it is being fixed. */
  function clearError(field: ReviewField) {
    setErrors((previous) => {
      if (previous[field] === undefined) return previous;
      const next = { ...previous };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "posting") return;

    const draft = { author: author.trim(), rating, body: body.trim() };
    const found = validateReviewDraft(draft);
    setErrors(found);

    if (Object.keys(found).length > 0) {
      // Focus the first thing that is wrong. Without this a keyboard reader is
      // left at the submit button with three messages they never hear.
      if (found.author) authorRef.current?.focus();
      else if (found.rating) ratingRef.current?.focus();
      else bodyRef.current?.focus();
      return;
    }
    if (!isRating(draft.rating)) return; // narrowing; validation already ran

    const optimistic: Review = {
      // Prefixed so it is obvious in the list that this id came from the
      // browser. The server assigns the real one once there is a store.
      id: `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      productSlug,
      author: draft.author,
      rating: draft.rating,
      body: draft.body,
      createdAt: new Date().toISOString(),
    };

    onPost(optimistic);
    setStatus("posting");

    const result = await postReview({ productSlug, ...draft });
    if (!result.ok) {
      onRollback(optimistic.id);
      setStatus("failed");
      return;
    }

    setStatus("posted");
    // The panel replaces the form, so the submit button unmounts under the
    // reader. Move focus to the confirmation, which reads it out as well.
    window.setTimeout(() => doneRef.current?.focus(), 0);
  }

  if (status === "posted") {
    return (
      <div
        ref={doneRef}
        tabIndex={-1}
        className={cn(
          "border border-hairline px-8 py-12 text-center",
          // Skipped outright under reduced motion — not run at 0s.
          !reducedMotion && "animate-rise-in",
        )}
      >
        <div className="flex justify-center">
          <Ring />
        </div>
        <h4 className="mt-8 font-display text-2xl font-extrabold tracking-[-0.02em] text-success">
          Your review has been posted.
        </h4>
        {/*
         * Instant publish. Nothing here claims a review is checked first,
         * because nothing checks it — `postReview` in lib/reviews/actions.ts is
         * still a stub. If a moderation queue is ever added, this copy has to
         * change with it, not after it.
         */}
        <p className="mx-auto mt-4 max-w-[42ch] text-sm leading-relaxed text-charcoal">
          It is on the page now, at the top of the list. Thank you for saying
          how the cloth turned out.
        </p>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="max-w-measure">
      <div>
        <label htmlFor={authorId} className="label text-charcoal">
          Name
        </label>
        <input
          ref={authorRef}
          id={authorId}
          name="author"
          type="text"
          autoComplete="name"
          maxLength={AUTHOR_MAX_LENGTH}
          value={author}
          aria-invalid={errors.author !== undefined}
          aria-describedby={authorHintId}
          onChange={(event) => {
            setAuthor(event.target.value);
            if (errors.author) clearError("author");
          }}
          className={cn(
            "mt-3 h-12 w-full rounded-none border bg-paper px-4 text-base text-ink",
            "transition-colors duration-200 ease-state placeholder:text-charcoal",
            "hover:border-purple-500 focus:border-purple-500",
            errors.author ? "border-purple-700" : "border-hairline",
          )}
        />
        <FieldNote id={authorHintId} error={errors.author} hint={AUTHOR_HINT} />
      </div>

      <div className="mt-8">
        <p id={ratingLabelId} className="label text-charcoal">
          Rating
        </p>
        <div
          role="group"
          aria-labelledby={ratingLabelId}
          aria-describedby={ratingHintId}
          className="-ml-2 mt-1 flex items-center"
          onMouseLeave={() => setPreview(0)}
        >
          {STARS.map((star) => {
            const lit = star <= (preview || rating);
            return (
              <button
                key={star}
                ref={star === 1 ? ratingRef : undefined}
                type="button"
                aria-pressed={rating === star}
                onClick={() => {
                  setRating(star);
                  if (errors.rating) clearError("rating");
                }}
                onMouseEnter={() => setPreview(star)}
                onFocus={() => setPreview(star)}
                onBlur={() => setPreview(0)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full"
              >
                <StarGlyph
                  size={22}
                  className={cn(
                    "transition-colors duration-150 ease-state",
                    lit ? "text-purple-500" : "text-hairline",
                  )}
                />
                <span className="sr-only">Rate {star} out of 5</span>
              </button>
            );
          })}
        </div>
        <FieldNote id={ratingHintId} error={errors.rating} hint={RATING_HINT} />
      </div>

      <div className="mt-8">
        <label htmlFor={bodyId} className="label text-charcoal">
          Your review
        </label>
        <textarea
          ref={bodyRef}
          id={bodyId}
          name="body"
          rows={5}
          maxLength={BODY_MAX_LENGTH}
          value={body}
          aria-invalid={errors.body !== undefined}
          aria-describedby={bodyHintId}
          onChange={(event) => {
            setBody(event.target.value);
            if (errors.body) clearError("body");
          }}
          placeholder="How did the cloth stitch up?"
          className={cn(
            "mt-3 w-full resize-y rounded-none border bg-paper px-4 py-3 text-base leading-relaxed text-ink",
            "transition-colors duration-200 ease-state placeholder:text-charcoal",
            "hover:border-purple-500 focus:border-purple-500",
            errors.body ? "border-purple-700" : "border-hairline",
          )}
        />
        <FieldNote id={bodyHintId} error={errors.body} hint={BODY_HINT} />
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
        <button
          type="submit"
          disabled={status === "posting"}
          className={cn(
            "label inline-flex min-h-[44px] items-center rounded-full border px-7",
            "transition-colors duration-200 ease-state",
            "border-ink bg-ink text-paper hover:border-purple-500 hover:bg-purple-500",
            status === "posting" && "opacity-60",
          )}
        >
          {status === "posting" ? "Sending" : "Post review"}
        </button>

        {/*
         * One live region for the outcome of the submit. The field notes are
         * descriptions, not announcements — three live regions would talk over
         * each other the moment two fields are wrong at once.
         */}
        <p id={statusId} role="status" className="label text-charcoal">
          {status === "failed"
            ? "That did not reach us. Nothing is lost — send it again."
            : ""}
        </p>
      </div>
    </form>
  );
}

/**
 * The hint line under a field, which becomes the error when there is one.
 *
 * No red, because there is no red in the system. A failure is marked by the
 * purple ring glyph and by the sentence — colour alone was never sufficient
 * anyway, and inventing a hue to say "wrong" would put an eighth token on the
 * page for the sake of one state.
 */
function FieldNote({
  id,
  error,
  hint,
}: {
  id: string;
  error?: string;
  hint: string;
}) {
  return (
    <p id={id} className="label mt-3 flex items-start gap-2 text-charcoal">
      {error !== undefined && (
        <svg
          viewBox="0 0 12 12"
          aria-hidden="true"
          className="mt-[-1px] h-3 w-3 shrink-0 text-purple-500"
          fill="none"
          stroke="currentColor"
        >
          <circle cx="6" cy="6" r="5" strokeWidth="1.25" />
          <path d="M6 3.4v3.1" strokeWidth="1.25" strokeLinecap="round" />
          <circle cx="6" cy="8.6" r="0.6" fill="currentColor" stroke="none" />
        </svg>
      )}
      <span>{error ?? hint}</span>
    </p>
  );
}

/** The ring from the wordmark, as the confirmation mark. */
function Ring() {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
      className="h-16 w-16 text-purple-500"
    >
      <circle cx="60" cy="60" r="38" strokeWidth="1.25" />
      <circle
        cx="60"
        cy="60"
        r="26"
        strokeWidth="1"
        strokeOpacity="0.4"
        strokeDasharray="5 7"
      />
    </svg>
  );
}
