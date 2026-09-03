"use client";

import { useId, useState, type InputHTMLAttributes } from "react";
import { m } from "framer-motion";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/cn";

/**
 * The auth pages' own input (client brief, 2026-09-03) — a taller, squarer
 * field than the shared `FormField` the rest of the site's forms use
 * (52px vs 48px, `rounded-[2px]`, a mono label above rather than beside),
 * plus the password show/hide toggle and inline `AlertCircle` error that
 * only these two pages call for.
 *
 * Deliberately a second component rather than more props on `FormField`:
 * that primitive is shared by checkout, newsletter, track-order and
 * notify-me, and widening it to cover a visual treatment only two pages
 * want is how a shared primitive stops being shared. The shake-on-error
 * behaviour is the same idea `FormField` already has, re-expressed here
 * against the error element rather than the whole label — the brief asks
 * for the *message* to shake in, not the field.
 */
export function AuthField({
  label,
  error,
  type = "text",
  className,
  ...inputProps
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string | null }) {
  const generatedId = useId().replace(/:/g, "");
  const inputId = inputProps.id ?? `auth-${generatedId}`;
  const errorId = `${inputId}-error`;
  const reducedMotion = usePrefersReducedMotion();
  const [revealed, setRevealed] = useState(false);

  const isPassword = type === "password";
  const resolvedType = isPassword && revealed ? "text" : type;

  return (
    <div>
      <label
        htmlFor={inputId}
        className="block font-mono text-[11px] uppercase tracking-[0.1em] text-charcoal"
      >
        {label}
      </label>

      <div className="relative mt-2">
        <input
          {...inputProps}
          id={inputId}
          type={resolvedType}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "h-[52px] w-full rounded-[2px] border bg-paper px-4 font-sans text-[15px] text-ink",
            "transition-[border-color] duration-200 ease-state placeholder:text-charcoal/50",
            "focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/15",
            isPassword && "pr-12",
            error ? "border-error" : "border-hairline",
            className,
          )}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((current) => !current)}
            aria-label={revealed ? "Hide password" : "Show password"}
            aria-pressed={revealed}
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-charcoal transition-colors duration-200 ease-state hover:text-ink"
          >
            {revealed ? (
              <EyeOff aria-hidden="true" size={16} strokeWidth={1.5} />
            ) : (
              <Eye aria-hidden="true" size={16} strokeWidth={1.5} />
            )}
          </button>
        )}
      </div>

      {error && (
        <m.p
          // Keyed on the message so a *different* error replaces the element
          // and replays the shake — without it, a second failed submit that
          // changes the text would slide the new copy in silently.
          key={error}
          id={errorId}
          className="mt-2 flex items-center gap-1.5 font-sans text-[13px] text-error"
          initial={{ opacity: 0 }}
          animate={reducedMotion ? { opacity: 1 } : { opacity: 1, x: [0, -8, 8, -4, 4, 0] }}
          transition={{ duration: reducedMotion ? 0.15 : 0.4 }}
        >
          <AlertCircle aria-hidden="true" size={14} strokeWidth={1.5} className="shrink-0" />
          {error}
        </m.p>
      )}
    </div>
  );
}
