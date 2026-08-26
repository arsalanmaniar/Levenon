"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { X } from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

const SESSION_KEY = "levenon-announcement-dismissed";
const ROTATE_MS = 3000;

const MESSAGES = [
  "Free delivery on all orders above PKR 5,000",
  "New Edit 01 — 48 pieces now live",
  "Unstitched lawn, chiffon, silk & more",
  "Hand-embroidered pieces — limited stock",
];

/**
 * Top-of-page ticker (client brief, 2026-08-30, Item 2) — Nishat Linen's
 * own convention. Sits above `SiteNav`; the nav reads `--announcement-h`
 * (set below) for its own `sticky top-*` offset rather than either
 * component knowing about the other directly.
 *
 * Same three-state, `useLayoutEffect`-gated dismissal `loading-screen.tsx`
 * already uses: `null` while undecided (renders nothing, both on the
 * server and for the one tick before the effect runs), then `true`/`false`
 * — decided synchronously before the browser paints the first client
 * frame, so a returning-this-session visitor who already dismissed it
 * never sees it flash on before disappearing, and the CSS var it writes
 * lands before paint too, so the nav never visibly jumps.
 */
export function AnnouncementBar() {
  const reducedMotion = usePrefersReducedMotion();
  const [visible, setVisible] = useState<boolean | null>(null);
  const [index, setIndex] = useState(0);

  useLayoutEffect(() => {
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      // Private browsing / storage disabled — show it; there is nothing to
      // remember a dismissal into, so showing it is the safer default.
    }
    setVisible(!dismissed);
    document.documentElement.style.setProperty(
      "--announcement-h",
      dismissed ? "0px" : "36px",
    );
  }, []);

  useEffect(() => {
    if (!visible) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % MESSAGES.length);
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [visible]);

  const dismiss = () => {
    setVisible(false);
    document.documentElement.style.setProperty("--announcement-h", "0px");
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // Nothing to persist into — the bar still stays dismissed for the
      // rest of this render, which is the visible behaviour that matters.
    }
  };

  if (!visible) return null;

  return (
    <div
      id="announcement-bar"
      // `sticky top-0`, stacked above `SiteNav`'s own `sticky
      // top-[var(--announcement-h)]` (client brief, 2026-08-30, Item 5) —
      // both stay pinned together while scrolling; without this, the bar
      // would scroll away normally and the nav's own dynamic `top` offset
      // would have nothing to actually compensate for (a nav that sticks
      // at `top:0` once the static-flow bar has scrolled past it is
      // already correct with no adjustment needed).
      className="sticky top-0 z-[60] flex h-9 items-center justify-center overflow-hidden bg-ink px-10 text-paper"
    >
      <AnimatePresence mode="wait">
        <m.p
          key={index}
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.4 }}
          className="truncate px-2 font-mono text-[11px] uppercase tracking-[0.12em]"
        >
          {MESSAGES[index]}
        </m.p>
      </AnimatePresence>

      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss announcement"
        className="absolute right-2 flex h-9 w-9 items-center justify-center text-paper/70 transition-colors duration-200 ease-state hover:text-paper"
      >
        <X aria-hidden="true" size={14} strokeWidth={1.5} />
      </button>
    </div>
  );
}
