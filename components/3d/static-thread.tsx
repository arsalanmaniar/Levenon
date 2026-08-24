import { cn } from "@/lib/cn";

type StaticThreadProps = {
  className?: string;
  /** Slow rotation of the dashed inner ring. Off by default. */
  animated?: boolean;
};

/**
 * Non-WebGL stand-in for the thread sculpture.
 *
 * Three jobs: the reserved-space placeholder while the R3F chunk loads, the
 * fallback when WebGL is unavailable or the context is lost, and the SSR
 * representation. Pure SVG — no JS, no layout shift, decorative only.
 *
 * Colour comes from `currentColor`, so the host section picks the variant
 * (purple-500 on paper, purple-300 in the dark section) and every placeholder
 * state matches without prop drilling.
 */
export function StaticThread({ className, animated = false }: StaticThreadProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("relative grid h-full w-full place-items-center", className)}
    >
      <div className="pointer-events-none absolute h-[70%] w-[70%] rounded-full bg-current opacity-[0.14] blur-3xl" />
      <svg
        viewBox="0 0 200 200"
        fill="none"
        stroke="currentColor"
        className="relative h-[62%] max-h-[420px] w-auto"
      >
        {/* The ring — the "e" from the wordmark. */}
        <circle cx="100" cy="100" r="62" strokeWidth="1.5" />
        {/* The stitch — dashed inner thread. */}
        <circle
          cx="100"
          cy="100"
          r="44"
          strokeWidth="1"
          strokeDasharray="6 8"
          strokeOpacity="0.55"
          className={animated ? "origin-center animate-thread-spin" : undefined}
          style={animated ? { animationDuration: "14s" } : undefined}
        />
        {/* The tail — thread leaving the loop. */}
        <path
          d="M100 38c34 0 62 28 62 62 0 20-9 37-24 49"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeOpacity="0.7"
        />
      </svg>
    </div>
  );
}
