"use client";

import { useSpotlightEnabled } from "./spotlight-surface";

/**
 * Card Spotlight — the Aceternity pattern, rebuilt on brand tokens and made
 * **additive**: the card's verified ±8° mouse tilt (Phase 1) is untouched
 * underneath.
 *
 * This component holds no listeners, no state and no subscriptions. The
 * enclosing `SpotlightSurface` runs one pointer listener for the whole grid and
 * moves the glow by writing `--spot-x`/`--spot-y`/`--spot-opacity` to whichever
 * element carries `data-spotlight`. All this renders is the marker and the glow.
 *
 * The wrapper always renders, because `className` carries the tile's own layout
 * (aspect ratio, border, background). Returning a bare fragment when the
 * spotlight is off would strip the card of its frame on touch devices and under
 * reduced motion — where the glow itself is correctly absent.
 */
export function CardSpotlight({
  children,
  className,
  /** Radius of the glow in px. */
  size = 260,
}: {
  children: React.ReactNode;
  className?: string;
  size?: number;
}) {
  const enabled = useSpotlightEnabled();

  return (
    <div
      data-spotlight={enabled ? "" : undefined}
      className={className}
      style={enabled ? { ["--spot-opacity" as string]: "0" } : undefined}
    >
      {children}
      {enabled && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 opacity-[var(--spot-opacity)] transition-opacity duration-300 ease-state"
          style={{
            background: `radial-gradient(${size}px circle at var(--spot-x, 50%) var(--spot-y, 50%), rgb(var(--purple-500-rgb) / 0.10), transparent 70%)`,
          }}
        />
      )}
    </div>
  );
}
