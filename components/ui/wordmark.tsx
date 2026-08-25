import { cn } from "@/lib/cn";

type WordmarkProps = {
  className?: string;
  /**
   * Screen-reader label when the wordmark is the only content of a link.
   * Omit it and the mark announces itself as "Levenon".
   */
  label?: string;
  /**
   * `"auto"` (default): follows the *site's* theme via `[data-theme="dark"]`
   * in globals.css — correct for the nav and mobile menu, which really do
   * sit on whichever surface the reader chose.
   *
   * `"dark"`: forces the dark-background asset regardless of site theme,
   * *and* flattens it to a solid `--paper` silhouette via a CSS filter —
   * for a surface that is always dark regardless of theme (the footer).
   * Without this, the footer bug this fixes was exactly the light-theme
   * case: `[data-theme="dark"]` is absent in light theme, so `.wordmark-asset`
   * served the *light* asset (ink text, a purple ring) onto the footer's
   * always-`bg-ink` background — ink-on-ink, reported as "broken/distorted".
   * The flatten-to-paper filter additionally answers the brief's specific
   * complaint about the ring: both raster assets bake a purple ring into
   * the pixels (see the file-level comment below), and purple-700 — the
   * dark asset's own ring colour — does not read against `--ink` any
   * better than purple-500 does; `brightness(0) invert(1)` maps every
   * non-transparent pixel to solid white regardless of its original hue,
   * which is the only way to recolour a flat raster without a second
   * exported asset.
   */
  surface?: "auto" | "dark";
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
export function Wordmark({ className, label, surface = "auto" }: WordmarkProps) {
  return (
    <span
      role="img"
      aria-label={label ?? "Levenon"}
      style={{
        aspectRatio: ASPECT,
        ...(surface === "dark"
          ? {
              backgroundImage: "url(/levenon-wordmark-dark.png)",
              filter: "brightness(0) invert(1)",
            }
          : undefined),
      }}
      className={cn(
        "wordmark-asset block h-[1.15em] w-auto shrink-0 text-[1.375rem]",
        className,
      )}
    />
  );
}
