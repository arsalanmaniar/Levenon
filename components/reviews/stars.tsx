import { cn } from "@/lib/cn";

/**
 * The star system — one shape, no dependency.
 *
 * A five-point star on a 24×24 grid, generated rather than traced: outer radius
 * 10.4, inner radius 4.4, first point at twelve o'clock, a vertex every 36°. It
 * is exported so the picker in `review-form.tsx` draws the same star the rating
 * display does. Two hand-drawn stars in one codebase drift, and the drift shows
 * most at 13px, which is the size the product header uses.
 */
export const STAR_PATH =
  "M12 1.6L14.59 8.44L21.89 8.79L16.18 13.36L18.11 20.41L12 16.4L5.89 20.41L7.82 13.36L2.11 8.79L9.41 8.44Z";

/** Mono utility text is 11px, so `sm` sits with a price without shouting. */
const STAR_PX = { sm: 13, md: 17 } as const;

export type StarSize = keyof typeof STAR_PX;

/**
 * One star, filled with `currentColor` so the caller sets purple or hairline
 * through a text class and never touches a hex.
 */
export function StarGlyph({
  size = 16,
  className,
}: {
  /** Edge length in pixels. Square. */
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className={cn("block shrink-0", className)}
    >
      <path d={STAR_PATH} fill="currentColor" />
    </svg>
  );
}

/**
 * Read-only rating display. Filled purple to `value`, hairline beyond it.
 *
 * Partial stars are done by clipping, not by a second half-star path and not by
 * an SVG gradient: each star is an overlay of the purple glyph inside a box
 * whose width is the fraction, over a hairline glyph. It stays vector-crisp at
 * any size, and — unlike a `<linearGradient>` — it needs no document-unique id,
 * so this remains a server component and several ratings can sit on one page
 * without their fills colliding.
 *
 * The stars are decoration; the value is carried by the `aria-label`.
 */
export function StarRating({
  value,
  size = "md",
  className,
}: {
  /** 0–5. Fractions are welcome — this is what renders a 4.3 average. */
  value: number;
  size?: StarSize;
  className?: string;
}) {
  const px = STAR_PX[size];
  const clamped = Math.min(5, Math.max(0, value));
  // "4 out of 5" for a submitted rating, "4.3 out of 5" for an average.
  const spoken = Number.isInteger(clamped) ? String(clamped) : clamped.toFixed(1);

  return (
    <span
      role="img"
      aria-label={`${spoken} out of 5`}
      className={cn(
        "inline-flex items-center",
        size === "sm" ? "gap-[2px]" : "gap-[3px]",
        className,
      )}
    >
      {[0, 1, 2, 3, 4].map((index) => {
        const fill = Math.min(1, Math.max(0, clamped - index));
        return (
          <span
            key={index}
            aria-hidden="true"
            className="relative block"
            style={{ width: px, height: px }}
          >
            <StarGlyph size={px} className="text-hairline" />
            {fill > 0 && (
              <span
                className="absolute inset-y-0 left-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <StarGlyph size={px} className="text-purple-500" />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}
