import { cn } from "@/lib/cn";

type WordmarkProps = {
  className?: string;
  /**
   * Screen-reader label when the wordmark is the only content of a link.
   * Omit it and the mark announces itself as "Levenon".
   */
  label?: string;
};

/**
 * Intrinsic aspect of the derived artwork, measured from the source PNG's ink
 * bounds (462 × 83). Declared so the box is reserved before the background
 * image arrives — a logo that resizes on load is a layout shift in the nav,
 * which is the worst place on the page to have one.
 */
const ASPECT = "462 / 83";

/**
 * The Levenon wordmark — the supplied logo artwork, not type.
 *
 * `Levenon-Logo.png` is the source of truth. `public/levenon-wordmark.png` and
 * its dark counterpart are that file cropped to its ink bounds with the white
 * background lifted to transparency; the purple ring and the thread are the
 * original pixels. Nothing here is drawn, traced or approximated, which is
 * what two earlier attempts got wrong: a dashed CSS rule and a hand-authored
 * SVG path both read as a strikethrough through the brand name.
 *
 * Rendered as a CSS background (see `.wordmark-asset` in globals.css) so the
 * light/dark swap costs a single request. Sizing is driven by `height` in `em`,
 * so the existing call sites keep controlling it with `text-*` exactly as they
 * did when this was text.
 *
 * **Known limit, stated rather than hidden:** the source is a 500px raster, and
 * the wordmark occupies only 83px of its height. At nav size (~25px tall, even
 * at 3× DPR) that is ample. At the footer's larger size on a high-DPR screen it
 * is being asked for slightly more detail than the file holds and will be a
 * touch soft. The fix is the original vector artwork, not a larger export of
 * this raster — there is no more detail in it to recover.
 */
export function Wordmark({ className, label }: WordmarkProps) {
  return (
    <span
      role="img"
      aria-label={label ?? "Levenon"}
      style={{ aspectRatio: ASPECT }}
      className={cn(
        "wordmark-asset block h-[1.15em] w-auto shrink-0 text-[1.375rem]",
        className,
      )}
    />
  );
}
