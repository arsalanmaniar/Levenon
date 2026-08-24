import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Shimmer button — the Aceternity "Shimmer Button" pattern, rebuilt on brand
 * tokens.
 *
 * A single purple sheen sweeps across the pill on hover. Implemented as a CSS
 * gradient on a pseudo-free child element rather than the library's animated
 * conic-gradient border: one compositor-only transform, no JS, no runtime cost,
 * and it inherits the reduced-motion floor in globals.css for free.
 *
 * Tones mirror ThreadButton so the two can sit side by side without a seam.
 */
type Tone = "solid" | "outline" | "solid-invert";

// Matched to ThreadButton's refreshed base (2026-08-24, Phase 7) so a primary
// shimmer CTA and a secondary ghost CTA sitting side by side share exactly the
// same height, padding and pressed behaviour — see that file for the reasoning.
const base =
  "group relative isolate inline-flex min-h-[48px] items-center justify-center gap-2 " +
  "overflow-hidden rounded-full px-7 label " +
  "transition-[color,background-color,border-color,transform] duration-200 ease-state " +
  "active:scale-[0.98] motion-reduce:active:scale-100";

const tones: Record<Tone, string> = {
  solid: "bg-ink text-paper hover:bg-purple-700",
  outline:
    "border border-hairline text-ink hover:border-purple-500 hover:text-purple-500",
  "solid-invert": "bg-paper text-ink hover:bg-purple-300",
};

/** The sweep itself. Sits above the fill, below the label. */
function Sheen({ tone }: { tone: Tone }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 translate-x-[-120%] skew-x-[-20deg]",
        "transition-transform duration-700 ease-enter group-hover:translate-x-[120%]",
        "motion-reduce:transition-none motion-reduce:group-hover:translate-x-[-120%]",
        tone === "solid"
          ? "bg-gradient-to-r from-transparent via-purple-300/30 to-transparent"
          : "bg-gradient-to-r from-transparent via-purple-500/15 to-transparent",
      )}
    />
  );
}

export function ShimmerButton({
  href,
  children,
  tone = "solid",
  className,
  scroll,
  /** Trailing arrow — for a CTA that goes somewhere, not for every button
   * wearing the shimmer style ("Apply", "Load more" stay plain). */
  icon = false,
}: {
  href: string;
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
  scroll?: boolean;
  icon?: boolean;
}) {
  return (
    <Link href={href} scroll={scroll} className={cn(base, tones[tone], className)}>
      <Sheen tone={tone} />
      {children}
      {icon && (
        <ArrowRight
          aria-hidden="true"
          strokeWidth={1.5}
          className="h-4 w-4 transition-transform duration-200 ease-state group-hover:translate-x-0.5"
        />
      )}
    </Link>
  );
}

/** Same treatment for real buttons (add to bag, filter apply). */
export function ShimmerAction({
  children,
  tone = "solid",
  className,
  ...props
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        base,
        tones[tone],
        "disabled:cursor-not-allowed disabled:bg-charcoal/30 disabled:hover:bg-charcoal/30",
        className,
      )}
    >
      {/* No sheen while disabled — a shimmering dead button reads as broken. */}
      {!props.disabled && <Sheen tone={tone} />}
      {children}
    </button>
  );
}
