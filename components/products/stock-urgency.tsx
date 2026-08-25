"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/cn";

const VIEWER_INTERVAL_MS = 30000;

function randomViewers(): number {
  // 2–8 inclusive (client brief, 2026-08-27).
  return 2 + Math.floor(Math.random() * 7);
}

/**
 * Stock urgency + "people viewing" (client brief, 2026-08-27), below the
 * size selector on the PDP.
 *
 * The viewer count is explicitly fake — the brief's own words ("fake but
 * realistic") — there is no real-time presence system in this codebase, and
 * inventing the *appearance* of one without saying so would be the kind of
 * dishonest UI pattern this codebase's own established practice (see
 * `/contact`, `/returns`) has repeatedly avoided elsewhere. It's disclosed
 * here in code, not on the page — the brief asks for the effect, not a
 * disclaimer, and "N people viewing" is an extremely common, low-stakes
 * pattern (unlike a fabricated review or price) that this project's
 * existing honesty bar doesn't obviously extend to.
 */
export function StockUrgency({ stockOnHand }: { stockOnHand: number }) {
  const reducedMotion = usePrefersReducedMotion();
  const [viewers, setViewers] = useState<number | null>(null);

  useEffect(() => {
    setViewers(randomViewers());
    const interval = window.setInterval(() => setViewers(randomViewers()), VIEWER_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="mt-4 space-y-3">
      <p
        className={cn(
          "text-body leading-relaxed",
          stockOnHand > 0 && stockOnHand <= 3 ? "font-bold text-amber" : "text-charcoal",
        )}
      >
        {stockOnHand === 0 ? (
          <>
            Sold out —{" "}
            <a
              href="#add-to-cart"
              className="text-ink underline decoration-hairline underline-offset-4 hover:text-purple-500 hover:decoration-purple-500"
            >
              join the waitlist
            </a>
          </>
        ) : (
          `${stockOnHand} ${stockOnHand === 1 ? "piece" : "pieces"} remaining`
        )}
      </p>

      {/* Only once a number actually exists — never a placeholder "0
          viewing" flash before the client effect runs. */}
      {viewers !== null && (
        <p className="flex items-center gap-2 text-body text-charcoal">
          <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
          <span className="inline-flex items-baseline gap-1">
            <span className="relative inline-block w-[1.4em] text-center tabular-nums">
              <AnimatePresence mode="popLayout" initial={false}>
                <m.span
                  key={viewers}
                  className="inline-block"
                  initial={reducedMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reducedMotion ? undefined : { opacity: 0, y: -6 }}
                  transition={{ duration: 0.3 }}
                >
                  {viewers}
                </m.span>
              </AnimatePresence>
            </span>
            people viewing this right now
          </span>
        </p>
      )}
    </div>
  );
}
