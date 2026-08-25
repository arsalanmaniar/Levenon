"use client";

import { useEffect, useState } from "react";
import { m } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/cn";

/** Below this many pixels of scroll, the page is already at the top — no button to offer. */
const SHOW_AFTER = 400;

/**
 * Stacks directly above the WhatsApp float — same corner, same size family,
 * one size down (40px against 56px): this is a convenience, not a second
 * primary action, and the sizing says so before the copy does.
 *
 * A `scroll` listener rather than an `IntersectionObserver` is deliberate for
 * once: there is no sentinel element to observe here, the question is
 * literally "how far down the whole page is the user", which is what
 * `scrollY` answers directly. `passive: true` keeps it off the scrolling
 * thread's critical path.
 */
export function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <m.button
      type="button"
      onClick={() =>
        window.scrollTo({
          top: 0,
          behavior: reducedMotion ? "auto" : "smooth",
        })
      }
      aria-label="Back to top"
      // Client brief, 2026-08-28 (Item 4C): "brief scale(0.9) → scale(1)
      // bounce" on click, on top of the smooth scroll it already had.
      // `whileTap` covers a click's press-then-release in one gesture; the
      // spring transition (not the linear one this file's other transitions
      // use) is what gives the settle its overshoot, i.e. the "bounce".
      whileTap={reducedMotion ? undefined : { scale: 0.9 }}
      transition={{ type: "spring", stiffness: 500, damping: 15 }}
      className={cn(
        "fixed z-40 grid h-10 w-10 place-items-center rounded-full border border-hairline bg-paper text-ink shadow-[0_4px_20px_rgb(11_11_13/0.15)] transition-colors duration-200 ease-state hover:border-purple-500 hover:text-purple-500",
        "bottom-24 right-6 md:bottom-28 md:right-10",
      )}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 19V5M6 11l6-6 6 6" />
      </svg>
    </m.button>
  );
}
