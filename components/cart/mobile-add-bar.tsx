"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { formatPrice, isInStock, type Product } from "@/lib/types";

/**
 * The mobile sticky bar: pinned to the bottom of the viewport on small
 * screens, but only once the real Add to Bag button (`#add-to-cart`) has
 * scrolled out of view (client brief, 2026-08-26) — previously always
 * visible, which meant it sat on screen at the same time as the button it
 * exists to stand in for.
 *
 * It does not duplicate `AddToCart`'s own size/quantity state — that state
 * lives in one place, the real size picker, and this bar's job is to get a
 * reader there in one tap rather than re-implement the same add-to-bag flow
 * twice. A plain in-page anchor scroll does that without a second source of
 * truth for what's selected.
 */
export function MobileAddBar({ product }: { product: Product }) {
  const inStock = isInStock(product);
  const reducedMotion = usePrefersReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById("add-to-cart");
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      // Only counts as "out of view" once it's scrolled fully past the top —
      // not the instant its bottom edge clears the viewport's own bottom,
      // which would show the bar while the button is still visible below it.
      { rootMargin: "0px 0px -100% 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <m.div
          className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-paper/95 backdrop-blur-md lg:hidden"
          initial={reducedMotion ? { opacity: 0 } : { y: "100%" }}
          animate={reducedMotion ? { opacity: 1 } : { y: 0 }}
          exit={reducedMotion ? { opacity: 0 } : { y: "100%" }}
          transition={{ duration: reducedMotion ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="mx-auto flex max-w-shell items-center justify-between gap-4 px-6 py-3">
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-bold tracking-[-0.01em]">
                {product.name}
              </p>
              <p className="font-mono text-sm font-medium text-purple-500">
                {formatPrice(product)}
              </p>
            </div>
            <a
              href="#add-to-cart"
              className="label inline-flex min-h-[48px] shrink-0 items-center justify-center rounded-full bg-ink px-6 text-paper transition-colors duration-200 ease-state hover:bg-purple-700"
            >
              {inStock ? "Add to bag" : "Notify me"}
            </a>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
