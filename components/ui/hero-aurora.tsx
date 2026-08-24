import { cn } from "@/lib/cn";

/**
 * The hero's background wash: paper base, a very faint purple radial glow
 * that drifts slowly behind the sculpture. Pure CSS `background-position`
 * animation on one absolutely positioned layer — no JS, no DOM churn, and
 * `motion-reduce` freezes it in place exactly like `BackgroundBeams`.
 */
export function HeroAurora({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 -z-20 animate-aurora-drift motion-reduce:animate-none",
        className,
      )}
      style={{
        backgroundImage:
          "radial-gradient(60% 55% at 72% 32%, rgb(var(--purple-500-rgb) / 0.03), transparent 70%)",
        backgroundSize: "160% 160%",
      }}
    />
  );
}
