/**
 * A thin animated line, drawing itself downward, pinned to the bottom of the
 * hero — the "there's more below" cue for a full-viewport hero that would
 * otherwise give no visual hint the page continues.
 *
 * Same drawn-line mechanism as SKILL.md §5 form 6 (the card hover line and
 * the nav underline), run in reverse and on a loop: `scaleY` from 0 to 1
 * with the transform origin at the top, so it reads as a thread paying out
 * downward rather than a generic pulsing dash. Brand easing throughout —
 * `ease-enter` on the draw, `ease-state` never applies here since nothing is
 * responding to an interaction.
 */
export function ScrollIndicator() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-6 hidden justify-center md:flex"
    >
      <span className="relative h-16 w-px overflow-hidden bg-hairline">
        <span className="absolute inset-x-0 top-0 h-full w-full origin-top scale-y-0 animate-scroll-draw bg-purple-500 motion-reduce:hidden" />
      </span>
    </div>
  );
}
