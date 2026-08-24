"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";

/**
 * Owns the spotlight for a whole grid: one capability subscription and one
 * pointer listener, however many cards are inside.
 *
 * Previously each card carried its own handlers and its own media-query reads.
 * Eight cards meant eight React components doing pointer work and re-deciding
 * the same two questions. Here the surface answers them once, hands the answer
 * down through context, and moves the glow by writing CSS custom properties
 * straight to the DOM — so a pointer sweep across the grid costs no React
 * render at all.
 *
 * Cards opt in by carrying `data-spotlight` (see `CardSpotlight`).
 */
const SpotlightContext = createContext(false);

export function useSpotlightEnabled(): boolean {
  return useContext(SpotlightContext);
}

export function SpotlightSurface({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  // Shared store: one MediaQueryList per query for the entire page.
  const finePointer = useMediaQuery("(pointer: fine)");
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)", true);
  const enabled = finePointer && !reducedMotion;

  useEffect(() => {
    const root = rootRef.current;
    if (!enabled || !root) return;

    // The card currently lit. Kept in a closure rather than state — this
    // changes on every pointer move and must never trigger a render.
    let current: HTMLElement | null = null;

    const dim = () => {
      current?.style.setProperty("--spot-opacity", "0");
      current = null;
    };

    const onMove = (event: PointerEvent) => {
      const target =
        (event.target as Element | null)?.closest<HTMLElement>("[data-spotlight]") ??
        null;

      if (target !== current) {
        current?.style.setProperty("--spot-opacity", "0");
        current = target;
        current?.style.setProperty("--spot-opacity", "1");
      }
      if (!current) return;

      const rect = current.getBoundingClientRect();
      current.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
      current.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
    };

    root.addEventListener("pointermove", onMove, { passive: true });
    root.addEventListener("pointerleave", dim);

    return () => {
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", dim);
      dim();
    };
  }, [enabled]);

  return (
    <div ref={rootRef} className={className}>
      <SpotlightContext.Provider value={enabled}>
        {children}
      </SpotlightContext.Provider>
    </div>
  );
}
