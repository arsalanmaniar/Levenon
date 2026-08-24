import { cn } from "@/lib/cn";

/**
 * Background Beams — the Aceternity pattern, rebuilt for a light brand.
 *
 * Aceternity's version animates ~50 SVG paths with Framer Motion on a dark
 * ground. That is the wrong shape for this site twice over: the brand is
 * paper-first, and 50 animated nodes behind the hero would compete with the
 * thread sculpture for both attention and frame budget — the skill allows one
 * bold moment per section (§5).
 *
 * This is four soft purple beams as pure CSS gradients, drifting very slowly.
 * No JS, no DOM churn, nothing to hydrate. `motion-reduce` freezes them, and
 * the whole layer is decorative and aria-hidden.
 */
const BEAMS = [
  { left: "8%", width: "18%", delay: "0s", duration: "26s", opacity: 0.05 },
  { left: "34%", width: "12%", delay: "-8s", duration: "32s", opacity: 0.04 },
  { left: "62%", width: "22%", delay: "-16s", duration: "29s", opacity: 0.05 },
  { left: "86%", width: "10%", delay: "-4s", duration: "35s", opacity: 0.03 },
];

export function BackgroundBeams({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 overflow-hidden",
        className,
      )}
    >
      {BEAMS.map((beam, index) => (
        <span
          key={index}
          className="absolute top-[-20%] h-[140%] animate-beam-drift motion-reduce:animate-none"
          style={{
            left: beam.left,
            width: beam.width,
            animationDelay: beam.delay,
            animationDuration: beam.duration,
            background: `linear-gradient(to bottom, transparent, rgb(var(--purple-500-rgb) / ${beam.opacity}), transparent)`,
            filter: "blur(28px)",
          }}
        />
      ))}

      {/* A single hairline stitch, echoing the divider motif. */}
      <span
        className="absolute inset-x-0 top-1/2 h-px"
        style={{
          background:
            "linear-gradient(to right, transparent, rgb(var(--purple-500-rgb) / 0.10), transparent)",
        }}
      />
    </div>
  );
}
