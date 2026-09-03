"use client";

import { useEffect, useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { AnimatePresence, m, useAnimationControls } from "framer-motion";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/cn";

const INK = "#0B0B0D";
const CHARCOAL = "#5B5A5F";
const PURPLE_500 = "#7C2AE8";
const ERROR = "#DC2626";
const HAIRLINE = "#EAE8E2";
const PAPER = "#FBFAF8";
/** The "subtle warmth on focus" the brief asks for — a shade off `--paper`, not a new token. */
const PAPER_FOCUS = "#FAFAF8";

/**
 * Wraps a field in the staggered entrance the auth forms share (client
 * brief, 2026-09-03: 0.3s in, 0.08s apart). Exported so both forms lay
 * their own fields out in order without each re-deriving the timing.
 */
export function AuthStagger({ index, children }: { index: number; children: ReactNode }) {
  const reducedMotion = usePrefersReducedMotion();
  return (
    <m.div
      initial={reducedMotion ? false : { y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        duration: reducedMotion ? 0 : 0.4,
        delay: reducedMotion ? 0 : 0.3 + index * 0.08,
      }}
    >
      {children}
    </m.div>
  );
}

/**
 * The auth pages' own input — a floating-label field, distinct from the
 * shared `FormField` the rest of the site's forms use.
 *
 * Deliberately a second component rather than more props on `FormField`:
 * that primitive is shared by checkout, newsletter, track-order and
 * notify-me, and widening it to carry a floating label, a password reveal
 * toggle and a focus glow — none of which those four forms want — is how a
 * shared primitive stops being shared.
 *
 * The label is absolutely positioned over the input and animates up and
 * down rather than being two elements swapped, so there is exactly one
 * accessible name for the field at all times. `pointer-events-none` on it
 * means a click anywhere in the box still lands on the input beneath;
 * `htmlFor` keeps the association a screen reader needs regardless.
 */
/**
 * Framer redefines these DOM handlers with its own signatures (an
 * `AnimationDefinition`, not a DOM `AnimationEvent`), so they are omitted
 * here rather than passed through to `m.input` where the two types
 * collide. Same reasoning — and the same omit list — as
 * `shimmer-button.tsx`'s own `NativeButtonProps`. Nothing in this codebase
 * passes any of them to a field.
 */
type NativeInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "onAnimationStart" | "onAnimationEnd" | "onAnimationIteration" | "onDrag" | "onDragStart" | "onDragEnd"
>;

export function AuthField({
  label,
  error,
  type = "text",
  className,
  value,
  onFocus,
  onBlur,
  ...inputProps
}: NativeInputProps & { label: string; error?: string | null }) {
  const generatedId = useId().replace(/:/g, "");
  const inputId = inputProps.id ?? `auth-${generatedId}`;
  const errorId = `${inputId}-error`;
  const reducedMotion = usePrefersReducedMotion();
  const [revealed, setRevealed] = useState(false);
  const [focused, setFocused] = useState(false);
  const shake = useAnimationControls();

  const isPassword = type === "password";
  const resolvedType = isPassword && revealed ? "text" : type;
  const hasValue = value !== undefined && value !== null && String(value).length > 0;
  const floated = focused || hasValue;

  // Shake on a *new* error. `useAnimationControls` rather than a keyed
  // remount: remounting would tear the input out of the DOM and take the
  // reader's focus with it, mid-correction.
  useEffect(() => {
    if (!error || reducedMotion) return;
    shake.start({ x: [0, -8, 8, -4, 4, 0], transition: { duration: 0.4 } });
  }, [error, reducedMotion, shake]);

  const labelColour = error ? ERROR : floated ? PURPLE_500 : CHARCOAL;
  const borderColour = error ? ERROR : focused ? PURPLE_500 : HAIRLINE;

  return (
    <div>
      <m.div className="relative pt-6" animate={shake}>
        <m.label
          htmlFor={inputId}
          className="pointer-events-none absolute left-4 top-6 flex h-[52px] origin-left items-center font-mono text-[11px] uppercase tracking-[0.1em]"
          animate={{
            y: floated ? -24 : 0,
            scale: floated ? 0.85 : 1,
            color: labelColour,
          }}
          transition={{ duration: reducedMotion ? 0 : 0.2 }}
        >
          {label}
        </m.label>

        <m.input
          {...inputProps}
          id={inputId}
          type={resolvedType}
          value={value}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? errorId : undefined}
          animate={{
            borderColor: borderColour,
            backgroundColor: focused ? PAPER_FOCUS : PAPER,
            boxShadow: focused && !error ? `0 0 0 3px ${PURPLE_500}26` : `0 0 0 0px ${PURPLE_500}00`,
          }}
          transition={{ duration: reducedMotion ? 0 : 0.2 }}
          className={cn(
            "h-[52px] w-full rounded-[2px] border px-4 font-sans text-[15px] outline-none",
            isPassword && "pr-12",
            className,
          )}
          style={{ color: INK }}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((current) => !current)}
            aria-label={revealed ? "Hide password" : "Show password"}
            aria-pressed={revealed}
            className="absolute right-3 top-6 flex h-[52px] w-8 items-center justify-center text-charcoal transition-colors duration-200 ease-state hover:text-ink"
          >
            {revealed ? (
              <EyeOff aria-hidden="true" size={16} strokeWidth={1.5} />
            ) : (
              <Eye aria-hidden="true" size={16} strokeWidth={1.5} />
            )}
          </button>
        )}
      </m.div>

      <AnimatePresence>
        {error && (
          <m.p
            id={errorId}
            className="mt-2 flex items-center gap-1.5 font-sans text-[13px] text-error"
            initial={reducedMotion ? { opacity: 0 } : { y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0.15 : 0.25 }}
          >
            <AlertCircle aria-hidden="true" size={13} strokeWidth={1.5} className="shrink-0" />
            {error}
          </m.p>
        )}
      </AnimatePresence>
    </div>
  );
}
