"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ShimmerAction } from "@/components/ui/shimmer-button";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { EMAIL_MAX_LENGTH, isValidEmail } from "@/lib/newsletter";
import { cn } from "@/lib/cn";

/*
 * Two failures, two sentences. Both name what to do next — "invalid input" on
 * its own tells the reader nothing they can act on.
 */
const EMPTY_MESSAGE = "Enter an email address";
const MALFORMED_MESSAGE = "That address is not complete — check it";
const HINT_MESSAGE = "One send per run — leave in one click";

/**
 * The ring from the wordmark's "e" — same construction as the empty states.
 *
 * Tinted `--success` here rather than `--purple-500`: this ring only ever
 * appears once the signup has actually completed, so it is a confirmation, not
 * decoration. SKILL.md §2 permits the token for exactly that.
 */
function Ring() {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
      className="h-20 w-20 text-success"
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

/**
 * The interactive half of the signup, split out so the section's heading and
 * copy can stay a server component. Only this island hydrates.
 */
export function NewsletterForm() {
  const reducedMotion = usePrefersReducedMotion();
  const id = useId().replace(/:/g, "");
  const inputId = `newsletter-email-${id}`;
  const statusId = `newsletter-status-${id}`;

  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const successRef = useRef<HTMLDivElement>(null);

  /*
   * The submit button unmounts with the form, so without this the keyboard
   * reader is dropped to the top of the document with no idea what happened.
   * Moving focus to the confirmation both fixes that and reads it out, which
   * is why the panel carries no live region of its own — it would double up.
   */
  useEffect(() => {
    if (subscribed) successRef.current?.focus();
  }, [subscribed]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const email = value.trim();
    if (email.length === 0) {
      setError(EMPTY_MESSAGE);
      return;
    }
    if (!isValidEmail(email)) {
      setError(MALFORMED_MESSAGE);
      return;
    }

    // Phase 2 goes here: `const result = await subscribeToNewsletter(email)`,
    // with a pending state on the button and `result.code` mapped to copy.
    setError(null);
    setValue("");
    setSubscribed(true);
  }

  if (subscribed) {
    return (
      <div
        ref={successRef}
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
        <h3 className="mt-8 font-display text-2xl font-extrabold tracking-[-0.02em] text-success">
          You&rsquo;re on the list
        </h3>
        <p className="mx-auto mt-4 max-w-[38ch] text-sm leading-relaxed text-charcoal">
          Watch for a note confirming it. The next send goes out when the
          following run leaves the table.
        </p>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit}>
      <label htmlFor={inputId} className="sr-only">
        Email address
      </label>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id={inputId}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          spellCheck={false}
          maxLength={EMAIL_MAX_LENGTH}
          placeholder="you@example.com"
          value={value}
          aria-invalid={error !== null}
          aria-describedby={statusId}
          onChange={(event) => {
            setValue(event.target.value);
            // Clear on edit: an error about what was typed a moment ago is
            // noise once the reader is fixing it.
            if (error !== null) setError(null);
          }}
          className={cn(
            "h-12 w-full min-w-0 flex-1 rounded-none border bg-paper px-4 text-base text-ink",
            "transition-colors duration-200 ease-state placeholder:text-charcoal",
            "hover:border-purple-500 focus:border-purple-500",
            error !== null ? "border-purple-700" : "border-hairline",
          )}
        />

        <ShimmerAction type="submit" className="shrink-0">
          Join the list
        </ShimmerAction>
      </div>

      {/*
       * One line under the field carries both the hint and the error, the way
       * the size picker does. It is always in the DOM — a live region mounted
       * along with its text is not reliably announced — and always the field's
       * description, so `aria-describedby` never points somewhere else.
       */}
      <p
        id={statusId}
        role="status"
        className={cn(
          "label mt-4",
          error !== null ? "text-purple-700" : "text-charcoal",
        )}
      >
        {error ?? HINT_MESSAGE}
      </p>
    </form>
  );
}
