"use client";

import { forwardRef, useEffect, useId, type InputHTMLAttributes } from "react";
import { m, useAnimationControls } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/cn";

/**
 * One input styling, one error pattern, shared by every form on the site
 * (checkout, newsletter, track order, notify me — client brief, 2026-08-28,
 * Items 4D/4E). Previously each form hand-rolled its own near-identical
 * `border-hairline bg-paper ...` class string; a shared primitive is what
 * keeps four independent copies from drifting out of sync the next time one
 * of them changes.
 *
 * `shakeSignal` is a number the parent bumps on a failed submit attempt —
 * not a boolean, because a *second* failed attempt on an already-invalid
 * field (nothing changed, submitted again) must shake again, and a boolean
 * flip can't express "the same failure happened twice". The field only
 * actually shakes if it is currently invalid (`error` is set) when the
 * signal changes, so a valid field sitting next to an invalid one stays
 * still.
 */
export type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string | null;
  shakeSignal?: number;
};

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  function FormField({ label, error, shakeSignal, id, className, ...inputProps }, ref) {
    const generatedId = useId().replace(/:/g, "");
    const inputId = id ?? `field-${generatedId}`;
    const errorId = `${inputId}-error`;
    const reducedMotion = usePrefersReducedMotion();
    const controls = useAnimationControls();

    useEffect(() => {
      if (!shakeSignal || !error || reducedMotion) return;
      controls.start({ x: [0, -8, 8, -4, 4, 0], transition: { duration: 0.4 } });
      // Only the signal should retrigger this — `error`/`controls` reading
      // their latest value inside the effect is enough, they must not
      // themselves cause a re-run (that would shake on every keystroke that
      // changes the error message's text).
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shakeSignal]);

    return (
      <m.label className="block" animate={controls}>
        <span className="label text-charcoal">{label}</span>
        <input
          id={inputId}
          ref={ref}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "mt-2 min-h-[48px] w-full rounded-sm border bg-paper px-4 text-base text-ink",
            "transition-[border-color] duration-200 ease-state placeholder:text-charcoal/50",
            "focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20",
            "hover:border-purple-500",
            error ? "border-error" : "border-hairline",
            className,
          )}
          {...inputProps}
        />
        {error && (
          <p id={errorId} className="mt-1.5 text-xs text-error">
            {error}
          </p>
        )}
      </m.label>
    );
  },
);
