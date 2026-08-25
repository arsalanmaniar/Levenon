"use client";

import { useEffect, useRef } from "react";
import { m, useAnimationControls } from "framer-motion";
import { useWishlist } from "./wishlist-provider";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/cn";
import type { Product } from "@/lib/types";

/**
 * Save toggle, used on cards and on the detail page.
 *
 * Both read the same provider, so the two stay in sync without any wiring at
 * the call sites. The state change is carried primarily by fill + colour,
 * which reads instantly and costs nothing under reduced motion — the brief
 * pulse below (client brief, 2026-08-25: "on wishlist add → scale(1.3)
 * pulse") is layered on top of that, not instead of it, and is skipped
 * outright under reduced motion rather than run at zero duration.
 *
 * The heart is decorative; the button carries the label, and `aria-pressed`
 * carries the state rather than colour alone.
 */
export function WishlistHeart({
  product,
  className,
  /** `card` sits over the tile; `inline` sits in a row of controls. */
  variant = "card",
}: {
  product: Product;
  className?: string;
  variant?: "card" | "inline";
}) {
  const { has, toggle } = useWishlist();
  const reducedMotion = usePrefersReducedMotion();
  const saved = has(product.id);

  // Pulses once on the false→true transition specifically, not on every
  // render where `saved` happens to already be true — a keyframes array
  // passed straight to `animate` would otherwise replay each time this
  // component re-renders for an unrelated reason (this reads shared
  // wishlist context, so it re-renders more often than just its own clicks).
  const controls = useAnimationControls();
  const wasSaved = useRef(saved);
  useEffect(() => {
    if (saved && !wasSaved.current && !reducedMotion) {
      controls.start({ scale: [1, 1.3, 1], transition: { duration: 0.3 } });
    }
    wasSaved.current = saved;
  }, [saved, reducedMotion, controls]);

  return (
    <m.button
      type="button"
      aria-pressed={saved}
      onClick={(event) => {
        // Cards wrap their content in a link — saving must not navigate.
        event.preventDefault();
        event.stopPropagation();
        toggle(product);
      }}
      whileHover={reducedMotion ? undefined : { scale: 1.15 }}
      animate={controls}
      transition={{ duration: 0.2 }}
      className={cn(
        "inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full transition-colors duration-200 ease-state",
        // Solid `bg-paper` rather than `bg-paper/90 backdrop-blur-sm`: this
        // control renders once per product tile, so the blur was a
        // compositor-sampled backdrop on every card in the grid. Profiling a
        // phone put Style & Layout at 1413 ms; opaque paper over the
        // photograph reads the same at 44px and costs nothing.
        variant === "card" &&
          "border border-hairline bg-paper hover:border-purple-500",
        variant === "inline" && "border border-hairline hover:border-purple-500",
        saved ? "text-purple-500" : "text-charcoal hover:text-purple-500",
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-[18px] w-[18px]"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path
          d="M12 20.5 4.2 12.9a4.8 4.8 0 0 1 0-6.8 4.8 4.8 0 0 1 6.8 0l1 1 1-1a4.8 4.8 0 0 1 6.8 0 4.8 4.8 0 0 1 0 6.8Z"
          strokeLinejoin="round"
        />
      </svg>
      <span className="sr-only">
        {saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
      </span>
    </m.button>
  );
}
