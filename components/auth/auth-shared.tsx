"use client";

import Link from "next/link";
import { m } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/cn";

/**
 * Solid submit button for the auth pages — explicitly **not**
 * `ShimmerButton`, which every other primary CTA on the site uses: the
 * brief's reasoning is that a login page wants a solid, trustworthy feel
 * rather than a sweeping highlight, so this one carries its sheen only on
 * hover.
 *
 * Three states share one fixed 52px box so nothing reflows between them:
 * idle (label), `loading` (label fades out, spinner fades in — both
 * absolutely positioned, so the button never resizes), and `success`
 * (green + a check, held for the moment before the redirect fires).
 *
 * **Background and text are token classes, not Framer `animate` colours
 * (fixed 2026-09-03).** They were previously a literal `#0B0B0D` fill under
 * a `text-paper` label — fine in light theme, but `--paper` resolves to
 * `#0F0E0D` under `[data-theme="dark"]`, so the label went near-black on a
 * still-black button and vanished. `bg-ink text-paper hover:bg-purple-700`
 * is exactly `ThreadButton`'s own `solid` tone: both tokens swap *together*,
 * which is the property that makes the pair safe in either theme. Framer
 * keeps `scale` and `letterSpacing`, which have no theme dimension — and it
 * could not have driven the colours anyway, since it cannot interpolate
 * `var(--token)` strings.
 */
export function AuthSubmitButton({
  children,
  loading = false,
  success = false,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean; success?: boolean }) {
  const reducedMotion = usePrefersReducedMotion();
  const busy = loading || success;

  return (
    <m.button
      type={props.type}
      onClick={props.onClick}
      disabled={busy || props.disabled}
      aria-busy={loading || undefined}
      className={cn(
        "group relative flex h-[52px] w-full items-center justify-center overflow-hidden rounded-[2px]",
        "font-display text-[14px] font-semibold text-paper",
        "transition-colors duration-[250ms] ease-state disabled:cursor-not-allowed",
        success ? "bg-success" : "bg-ink",
        !busy && "hover:bg-purple-700",
        props.className,
      )}
      initial={false}
      animate={{ letterSpacing: "0.08em" }}
      whileHover={reducedMotion || busy ? undefined : { scale: 1.01, letterSpacing: "0.12em" }}
      whileTap={reducedMotion || busy ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.25 }}
    >
      {/* The sheen — a CSS sweep rather than a Framer animation, so it can
          key off `group-hover` without this component tracking hover state
          it has no other use for. */}
      {!busy && (
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 -translate-x-full",
            "bg-gradient-to-r from-transparent via-paper/10 to-transparent",
            "transition-transform duration-[600ms] ease-out group-hover:translate-x-full",
            "motion-reduce:transition-none motion-reduce:group-hover:-translate-x-full",
          )}
        />
      )}

      <m.span
        animate={{ opacity: busy ? 0 : 1 }}
        transition={{ duration: reducedMotion ? 0 : 0.2 }}
      >
        {children}
      </m.span>

      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Loader2 aria-hidden="true" size={18} strokeWidth={2} className="animate-spin" />
          <span className="sr-only">Signing you in</span>
        </span>
      )}

      {success && (
        <m.span
          className="absolute inset-0 flex items-center justify-center"
          initial={reducedMotion ? false : { scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Check aria-hidden="true" size={20} strokeWidth={2.5} />
        </m.span>
      )}
    </m.button>
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
      <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z" />
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
 * Social sign-in buttons — **not wired to anything yet.**
 *
 * TODO(wire to OAuth): this project's auth is `localStorage`-only (see
 * `lib/auth/auth-context.tsx`) — there is no server, no callback route and
 * no client secret for a real OAuth flow to use.
 *
 * These were `disabled` last pass. The brief asks for hover/tap animations
 * on them, and a disabled control that lifts under the pointer is a worse
 * lie than an enabled one: it invites the interaction and then refuses it
 * silently. So they are live buttons that answer honestly — a toast saying
 * the provider isn't connected yet — using the toast system this codebase
 * already has. Nothing pretends to sign anyone in.
 */
export function AuthSocialButtons() {
  const { showToast } = useToast();
  const reducedMotion = usePrefersReducedMotion();

  const base =
    "flex h-11 flex-1 items-center justify-center gap-2 rounded-[2px] border border-hairline bg-paper font-sans text-[13px] text-charcoal";

  const notConnected = (provider: string) =>
    showToast(`${provider} sign-in isn't connected yet`, "info");

  return (
    <div className="mt-4 flex gap-3">
      {[
        { name: "Google", mark: <GoogleMark /> },
        { name: "Facebook", mark: <FacebookMark /> },
      ].map((provider) => (
        <m.button
          key={provider.name}
          type="button"
          onClick={() => notConnected(provider.name)}
          className={base}
          initial={false}
          // `--purple-300` is one of the few tokens that does *not* remap in
          // dark theme, so the literal is honest here. The lift shadow is
          // deliberately left black: it reads on paper and simply doesn't
          // register on the dark ground, which is the correct behaviour for
          // a drop shadow rather than something to invert.
          whileHover={
            reducedMotion
              ? undefined
              : { y: -2, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", borderColor: "#B98CF2" }
          }
          whileTap={reducedMotion ? undefined : { y: 0, scale: 0.98 }}
          transition={{ duration: 0.2 }}
        >
          {provider.mark}
          {provider.name}
        </m.button>
      ))}
    </div>
  );
}

const MotionLink = m(Link);

/**
 * Bottom-of-form link whose arrow slides on hover.
 *
 * `whileHover` sits on the *link* and the arrow reads it through a
 * variant, not on the arrow itself — `whileHover` only fires for the
 * element actually under the pointer, so an arrow carrying its own would
 * move only when hovered directly, not when the reader hovers the words
 * next to it. Framer propagates named variants to children, which is what
 * makes one gesture drive the other element.
 */
export function AuthSwitchLink({ href, children }: { href: string; children: string }) {
  const reducedMotion = usePrefersReducedMotion();
  return (
    <MotionLink
      href={href}
      className="inline-flex items-center gap-1 text-purple-500 transition-colors duration-200 ease-state hover:text-purple-700"
      initial={false}
      whileHover={reducedMotion ? undefined : "hover"}
    >
      {children}
      <m.span
        aria-hidden="true"
        className="inline-block"
        variants={{ hover: { x: 4 } }}
        transition={{ duration: 0.2 }}
      >
        →
      </m.span>
    </MotionLink>
  );
}

/** "Forgot password?" — colour shift plus an underline that draws in from the left. */
export function AuthForgotLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="group relative inline-block font-mono text-[11px] text-purple-500 transition-colors duration-200 ease-state hover:text-purple-700"
    >
      Forgot password?
      <span
        aria-hidden="true"
        className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-purple-700 transition-transform duration-200 ease-enter group-hover:scale-x-100"
      />
    </Link>
  );
}
