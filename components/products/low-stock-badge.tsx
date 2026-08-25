import { cn } from "@/lib/cn";

/**
 * "Only X left" urgency badge (client brief, 2026-08-27) — shown when
 * `0 < stockOnHand <= 5`.
 *
 * Filled amber with ink text, not amber text on a light fill: amber-600
 * (`#D97706`, the brief's own literal hex) measures ~2.4:1 against both
 * `--paper` and white, well under WCAG AA's 4.5:1 floor for normal text
 * regardless of which side of the pair carries the colour — contrast is
 * symmetric, swapping foreground/background doesn't change the ratio. Ink
 * text on the amber fill reads clearly (dark-on-mid-saturation is the same
 * principle caution signage uses) while the badge itself still reads as
 * amber at a glance, which is what "Color: amber" is actually asking for
 * visually. Disclosed rather than silently using amber text on paper, which
 * would have shipped genuinely hard-to-read badges.
 *
 * A plain server component — the pulse is pure CSS (`animate-low-stock-pulse`,
 * `motion-reduce:animate-none`), no client JS needed to drive it.
 */
export function LowStockBadge({
  stockOnHand,
  className,
}: {
  stockOnHand: number;
  className?: string;
}) {
  if (stockOnHand <= 0 || stockOnHand > 5) return null;

  return (
    <span
      className={cn(
        "label animate-low-stock-pulse rounded-full bg-amber px-2.5 py-1 text-ink motion-reduce:animate-none",
        className,
      )}
    >
      Only {stockOnHand} left
    </span>
  );
}
