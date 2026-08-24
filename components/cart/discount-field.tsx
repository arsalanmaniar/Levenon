"use client";

import { useId, useState } from "react";
import {
  applyDiscount,
  type ApplyResult,
  type DiscountCode,
} from "@/lib/cart/discount";

/**
 * Code entry for the bag.
 *
 * State lives in `CartDrawer`, not here, because the drawer's *panel* unmounts
 * when the bag closes — holding the applied code in this component would silently
 * drop it the moment the customer went back to browse. `CartDrawer` itself stays
 * mounted, so the code survives open/close, which is what a shopper expects.
 *
 * The applied state is tinted `--success` (#2D7A4F, 5.02:1 on paper), the one
 * non-purple accent in the palette — added to SKILL.md §2 for confirmation
 * states exactly like this one. **Colour is never the only carrier**: the tick
 * glyph and the code with its value in words both stand on their own, so the
 * message survives greyscale, colour-blindness and a screen reader.
 */
export function DiscountField({
  applied,
  onApply,
  onClear,
}: {
  applied: DiscountCode | null;
  onApply: (discount: DiscountCode) => void;
  onClear: () => void;
}) {
  const [value, setValue] = useState("");
  const [result, setResult] = useState<ApplyResult | null>(null);
  const inputId = `discount-${useId().replace(/:/g, "")}`;
  const feedbackId = `${inputId}-feedback`;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const outcome = applyDiscount(value, applied);
    setResult(outcome);

    // "already" deliberately does nothing to cart state — applying the same
    // code twice is a no-op, not a second reduction.
    if (outcome.status === "applied") {
      onApply(outcome.discount);
      setValue("");
    }
  };

  const invalid = result?.status === "unknown" || result?.status === "empty";

  return (
    <div className="border-t border-hairline px-6 py-5">
      <form onSubmit={submit} noValidate>
        <label htmlFor={inputId} className="label block text-charcoal">
          Discount code
        </label>

        <div className="mt-3 flex gap-2">
          <input
            id={inputId}
            name="discount"
            type="text"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              if (result) setResult(null);
            }}
            aria-invalid={invalid || undefined}
            aria-describedby={result ? feedbackId : undefined}
            placeholder="LEVENON10"
            className="label min-h-[44px] w-full min-w-0 border border-hairline bg-paper px-4 text-ink placeholder:text-charcoal focus-visible:border-purple-500 focus-visible:outline-none"
          />
          <button
            type="submit"
            className="label min-h-[44px] shrink-0 rounded-full border border-hairline px-5 text-ink transition-colors duration-200 ease-state hover:border-purple-500 hover:text-purple-500"
          >
            Apply
          </button>
        </div>
      </form>

      {/*
        `aria-live` so the outcome is announced without moving focus. No
        animation on any branch — the brief rules it out, and a result that
        fades in is a result a screen reader may read before it settles.
      */}
      <div id={feedbackId} role="status" aria-live="polite">
        {result?.status === "unknown" && (
          <p className="label mt-3 text-charcoal">Code not recognised</p>
        )}
        {result?.status === "empty" && (
          <p className="label mt-3 text-charcoal">Enter a code first</p>
        )}
        {result?.status === "already" && (
          <p className="label mt-3 text-charcoal">
            {result.discount.code} is already applied
          </p>
        )}
      </div>

      {applied && (
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="label inline-flex items-center gap-2 text-success">
            <Tick />
            {applied.code} — {applied.label}
            {applied.condition ? ` · ${applied.condition}` : ""}
          </p>
          <button
            type="button"
            onClick={() => {
              onClear();
              setResult(null);
            }}
            className="label inline-flex min-h-[44px] items-center text-charcoal transition-colors duration-200 ease-state hover:text-purple-500"
          >
            Remove
            <span className="sr-only"> discount code {applied.code}</span>
          </button>
        </div>
      )}
    </div>
  );
}

/** Hairline tick, drawn in the same weight as the rest of the brand's line art. */
function Tick() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="h-3.5 w-3.5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 8.5 6.5 12 13 4.5" />
    </svg>
  );
}
