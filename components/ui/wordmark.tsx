import { cn } from "@/lib/cn";

type WordmarkProps = {
  className?: string;
  /**
   * Screen-reader label when the wordmark is the only content of a link.
   * Omit it and the mark announces itself as "Levenon".
   */
  label?: string;
  /**
   * Forces the wordmark to a single flat colour via a CSS `mask-image`
   * (client brief, 2026-08-28) — omit for the normal two-tone, theme-aware
   * rendering (ink or paper text, a purple ring) the nav and mobile menu
   * use, which swaps automatically via `[data-theme="dark"]` in
   * globals.css and must keep doing so.
   *
   * A mask, not `background-image` + `filter`, and not a `currentColor`
   * SVG: the source is a flat two-tone raster (ink/paper letters, a purple
   * ring — see the file doc comment), so there is no single CSS property
   * that recolours "the ring, but only the ring" on it, and no way to make
   * `currentColor` mean anything to a `background-image` at all. Masking
   * throws the raster's own colour away and keeps only its alpha
   * silhouette, then paints that silhouette in `logoColour` via
   * `background-color` — which is what makes an arbitrary colour prop
   * possible on a flat raster in the first place. Both letters and the
   * ring come out the one colour given; that is a real loss of the
   * two-tone artwork, accepted deliberately for a context — the footer —
   * that is always dark regardless of site theme and needs the mark to
   * simply be legible there, not to carry its usual accent.
   *
   * Default `"currentColor"`, per the brief's own literal request — pair it
   * with a `text-*` colour utility in `className` (the footer uses
   * `text-paper`) the same way any `currentColor`-based icon works.
   */
  logoColour?: string;
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
 * did when this was text — `logoColour` callers override that with an
 * explicit pixel height instead; see the footer's own call site.
 *
 * **Known limit, stated rather than hidden:** the source is a 500px raster, and
 * the wordmark occupies only 83px of its height. At nav size (~25px tall, even
 * at 3× DPR) that is ample. At the footer's larger size on a high-DPR screen it
 * is being asked for slightly more detail than the file holds and will be a
 * touch soft. The fix is the original vector artwork, not a larger export of
 * this raster — there is no more detail in it to recover.
 */
export function Wordmark({ className, label, logoColour }: WordmarkProps) {
  const forced = logoColour !== undefined;

  return (
    <span
      role="img"
      aria-label={label ?? "Levenon"}
      style={
        forced
          ? {
              aspectRatio: ASPECT,
              backgroundImage: "none",
              backgroundColor: logoColour,
              WebkitMaskImage: "url(/levenon-wordmark-dark.png)",
              maskImage: "url(/levenon-wordmark-dark.png)",
              WebkitMaskSize: "contain",
              maskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: "left center",
              maskPosition: "left center",
            }
          : { aspectRatio: ASPECT }
      }
      className={cn(
        "block w-auto shrink-0",
        // `cn` here is a plain joiner, not a Tailwind-merge — leaving both
        // `h-[1.15em]` and a caller's own `h-*` in the class list would let
        // stylesheet order, not JSX order, decide which wins. Omitting the
        // em-based height/font-size pair entirely when `forced` (the caller
        // is expected to set its own `h-*` — see the footer's call site)
        // avoids that conflict outright rather than relying on override luck.
        forced ? undefined : "wordmark-asset h-[1.15em] text-[1.375rem]",
        className,
      )}
    />
  );
}
