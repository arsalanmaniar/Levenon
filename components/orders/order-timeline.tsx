"use client";

import { m } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { ORDER_STATUS_SEQUENCE, orderStatusIndex } from "@/lib/orders/order-types";
import type { OrderStatus } from "@/lib/orders/order-types";
import { cn } from "@/lib/cn";

// Brand entrance: rise + fade, expo-out. Never scale, never slide from a side.
const EASE = [0.16, 1, 0.3, 1] as const;
const HIDDEN = { opacity: 0, y: 18 };
const SHOWN = { opacity: 1, y: 0 };
const STAGGER = 0.07;

/** Text cue per step. Status is never carried by colour alone. */
const CUE: Record<"done" | "current" | "pending", string> = {
  done: "Done",
  current: "Where it is now",
  pending: "Not yet",
};

/**
 * The node: the wordmark ring, at 20px.
 *
 * Reached steps fill the centre; pending steps stay open. A hairline stroke
 * either way — a solid dot or a tick would be a different vocabulary.
 */
function StepNode({ reached }: { reached: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
      className={cn("h-5 w-5", reached ? "text-purple-500" : "text-hairline")}
    >
      <circle cx="10" cy="10" r="8" strokeWidth="1.25" />
      {reached && <circle cx="10" cy="10" r="3.25" fill="currentColor" stroke="none" />}
    </svg>
  );
}

/** "dispatched" → "Dispatched" — the store keeps statuses lowercase (client brief, 2026-08-25). */
function displayStatus(status: OrderStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function StepBody({
  status,
  state,
}: {
  status: OrderStatus;
  state: "done" | "current" | "pending";
}) {
  return (
    <div className="-mt-[3px] min-w-0">
      <p className={cn("label", state === "pending" ? "text-charcoal" : "text-ink")}>
        {displayStatus(status)}
      </p>
      <p className="label mt-2 text-charcoal">{CUE[state]}</p>
    </div>
  );
}

/**
 * Vertical progress through the order statuses.
 *
 * Reads as a real ordered list, because that is what it is: five steps, in
 * sequence, one of them current. The current step is marked `aria-current`
 * *and* carries a text cue, so nothing here depends on seeing the purple.
 *
 * Under reduced motion the finished state is rendered directly — plain `<li>`
 * elements, no animation constructed at all rather than one run at zero
 * duration.
 */
export function OrderTimeline({
  status,
  orderId,
  className,
}: {
  status: OrderStatus;
  /** Used only to name the list for a screen reader. */
  orderId: string;
  className?: string;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const current = orderStatusIndex(status);

  return (
    <ol aria-label={`Progress of order ${orderId}`} className={cn("mt-6", className)}>
      {ORDER_STATUS_SEQUENCE.map((step, index) => {
        const reached = current >= 0 && index <= current;
        const isCurrent = index === current;
        const state = isCurrent ? "current" : reached ? "done" : "pending";

        const inner = (
          <>
            <div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute bottom-full left-1/2 h-7 w-px -translate-x-1/2",
                    reached ? "bg-purple-500" : "bg-hairline",
                  )}
                />
              )}
              <StepNode reached={reached} />
            </div>
            <StepBody status={step} state={state} />
          </>
        );

        const shared = {
          className: "relative flex gap-4 pb-7 last:pb-0",
          "aria-current": isCurrent ? ("step" as const) : undefined,
        };

        if (reducedMotion) {
          return (
            <li key={step} {...shared}>
              {inner}
            </li>
          );
        }

        return (
          <m.li
            key={step}
            {...shared}
            initial={HIDDEN}
            animate={SHOWN}
            transition={{ duration: 0.7, delay: index * STAGGER, ease: EASE }}
          >
            {inner}
          </m.li>
        );
      })}
    </ol>
  );
}
