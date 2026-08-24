import { cn } from "@/lib/cn";

type StitchDividerProps = {
  className?: string;
  /** Dark section variant. */
  invert?: boolean;
};

/**
 * The scroll stitch: a dashed purple rule that sews itself across the page as
 * the section enters view (SKILL.md §5.2/§5.3).
 *
 * **Zero JavaScript.** This used to be a client component that dynamically
 * imported GSAP + ScrollTrigger to scrub a clip rect. GSAP's evaluation was a
 * 542 ms long task on `/` and the single largest item in Total Blocking Time —
 * for one line that wipes in. It is now a native CSS scroll-driven animation
 * (`animation-timeline: view()`), so it is a **server component**: no hook, no
 * ref, no effect, no bundle.
 *
 * Support is ~84% (Chrome/Edge 115+, Safari 18+, Firefox 132+). Everywhere else
 * the `@supports` block never applies and the divider simply ships **fully
 * drawn** — which was already the no-JS fallback state, so nothing regresses.
 *
 * Reduced motion is handled in CSS by the same `@media` guard, and the divider
 * again stays fully drawn rather than animating at zero duration.
 */
export function StitchDivider({ className, invert = false }: StitchDividerProps) {
  return (
    <div aria-hidden="true" className={cn("stitch-divider w-full py-2", className)}>
      <svg
        viewBox="0 0 100 2"
        preserveAspectRatio="none"
        className="h-[2px] w-full overflow-visible"
      >
        <line
          x1="0"
          y1="1"
          x2="100"
          y2="1"
          stroke={invert ? "var(--purple-300)" : "var(--purple-500)"}
          strokeOpacity="0.5"
          strokeWidth="1"
          strokeDasharray="1.2 1.6"
          vectorEffect="non-scaling-stroke"
          className="stitch-divider__line"
        />
      </svg>
    </div>
  );
}
