"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Solid submit button for the auth pages (client brief, 2026-09-03) —
 * explicitly **not** `ShimmerButton`, which every other primary CTA on the
 * site uses: the brief's reasoning is that a login page wants a solid,
 * trustworthy feel rather than a sweeping highlight, and that's a fair read
 * of the convention every luxury retailer's sign-in page follows.
 */
export function AuthSubmitButton({
  children,
  loading = false,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={cn(
        "flex h-[52px] w-full items-center justify-center gap-2 rounded-[2px] bg-ink font-display text-[14px] font-semibold tracking-[0.05em] text-paper",
        "transition-colors duration-200 ease-state hover:bg-purple-700",
        "disabled:cursor-not-allowed disabled:opacity-70",
        props.className,
      )}
    >
      {loading && <Loader2 aria-hidden="true" size={16} strokeWidth={2} className="animate-spin" />}
      {children}
    </button>
  );
}

/** "or continue with", hairline rules either side. */
export function AuthDivider() {
  return (
    <div className="mt-8 flex items-center gap-4">
      <span className="h-px flex-1 bg-hairline" />
      <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-charcoal/50">
        or continue with
      </span>
      <span className="h-px flex-1 bg-hairline" />
    </div>
  );
}

/** Google's mark, hand-authored — no icon library ships it (trademark), and this avoids adding one. */
function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 18 18" className="h-4 w-4">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}

function FacebookMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 18 18" className="h-4 w-4">
      <path
        fill="#1877F2"
        d="M18 9a9 9 0 1 0-10.41 8.89v-6.29H5.31V9h2.28V7.02c0-2.25 1.34-3.5 3.4-3.5.98 0 2.01.18 2.01.18v2.21h-1.13c-1.12 0-1.47.69-1.47 1.4V9h2.5l-.4 2.6h-2.1v6.29A9 9 0 0 0 18 9Z"
      />
    </svg>
  );
}

/**
 * Social sign-in buttons — **not wired to anything yet**.
 *
 * TODO(wire to OAuth): these are inert by design for now. This project's
 * auth is `localStorage`-only (see `lib/auth/auth-context.tsx`), so there
 * is no server, no callback route and no client secret for an OAuth flow to
 * use. Rendered `disabled` with an explicit title rather than as live
 * buttons that would silently do nothing when clicked — a dead control that
 * looks alive is worse than one that says so.
 */
export function AuthSocialButtons() {
  const base =
    "flex h-11 flex-1 items-center justify-center gap-2 rounded-[2px] border border-hairline font-sans text-[13px] text-charcoal transition-colors duration-200 ease-state hover:bg-hairline/50 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="mt-4 flex gap-3">
      <button type="button" disabled title="Not connected yet" className={base}>
        <GoogleMark />
        Google
      </button>
      <button type="button" disabled title="Not connected yet" className={base}>
        <FacebookMark />
        Facebook
      </button>
    </div>
  );
}
