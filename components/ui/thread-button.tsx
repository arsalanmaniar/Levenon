"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { m } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/cn";

type Tone = "solid" | "outline" | "solid-invert" | "outline-invert";

type ThreadButtonProps = {
  href: string;
  children: React.ReactNode;
  /** `*-invert` variants are for the dark signature section. */
  tone?: Tone;
  /**
   * Passed through to `next/link`. Set false when the destination is the same
   * page in a new state (a filter reset, say) and jumping to the top would lose
   * the reader's place.
   */
  scroll?: boolean;
  className?: string;
  /** Trailing arrow — same opt-in as `ShimmerButton`'s `icon` prop, for a
   * CTA that goes somewhere rather than every pill on the site. */
  icon?: boolean;
};

/**
 * The pill is kept — SKILL.md §4 locks it ("`rounded-full` for pills, chips,
 * buttons, and anything referencing the ring motif"), and the pill echoing the
 * wordmark's ring is the brand's own logic, not a default inherited from a UI
 * kit. What changed (2026-08-24, Phase 7) is making it look *deliberate* at
 * that shape rather than generic:
 *
 *   - real height (min 48px) and generous horizontal padding, so it reads as
 *     a considered object rather than text with a border around it;
 *   - the mono label's tracking opened to the brand's `0.18em` label spacing,
 *     which is what makes a pill read as fashion rather than as a SaaS chip;
 *   - a pressed state (`active:scale-[0.98]`) — previously there was none at
 *     all, so the control gave no physical feedback on click;
 *   - transitions extended to `colors` *and* `transform`, on the brand's own
 *     `ease-state` curve.
 *
 * Hierarchy is carried by tone, not by size: `solid` is the primary voice,
 * `outline` deliberately recedes (hairline border, no fill) so a secondary CTA
 * beside a primary one never competes with it.
 */
/*
 * `px-7`, not `px-8`. The wider padding (with `.label` also having gone
 * 11px → 12px in the same pass) pushed the hero's two CTAs to ~631px inside a
 * ~608px column, so they wrapped onto separate lines on desktop — caught in
 * screenshot review, not by reading the class list. Seven units still reads as
 * a considered, roomy pill; eight did not fit the layout it sits in.
 */
// `duration-[250ms]`, not the shared `duration-200`, on the colour/border
// transition specifically (client brief, 2026-08-25: "0.25s" for the ghost
// button's fill and border transition). Press feedback moved off
// `active:scale-[0.98]` onto Framer's `whileTap` below, same reasoning as
// `ShimmerButton`.
// `text-[13px]` fixed — see the identical note in `shimmer-button.tsx`.
const base =
  "group label text-[13px] inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full px-7 " +
  "transition-[color,background-color,border-color] duration-[250ms] ease-state";

const tones: Record<Tone, string> = {
  solid: "bg-ink text-paper hover:bg-purple-700",
  outline:
    "border border-hairline text-ink hover:border-ink hover:bg-ink hover:text-paper",
  "solid-invert": "bg-paper text-ink hover:bg-purple-300",
  "outline-invert":
    "border border-paper/25 text-paper hover:border-paper hover:bg-paper hover:text-ink",
};

const MotionLink = m(Link);

/**
 * The only button shape on the site: a pill, because the pill echoes the ring.
 * Rendered as links — for real `<button>` elements see `ShimmerAction`.
 */
export function ThreadButton({
  href,
  children,
  tone = "solid",
  scroll,
  className,
  icon = false,
}: ThreadButtonProps) {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <MotionLink
      href={href}
      scroll={scroll}
      className={cn(base, tones[tone], className)}
      whileHover={reducedMotion ? undefined : { scale: 1.02 }}
      whileTap={reducedMotion ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.2 }}
    >
      {children}
      {icon && (
        <ArrowRight
          aria-hidden="true"
          strokeWidth={1.5}
          className="h-4 w-4 transition-transform duration-200 ease-state group-hover:translate-x-0.5"
        />
      )}
    </MotionLink>
  );
}
