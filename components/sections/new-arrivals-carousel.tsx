"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { m } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { NewArrivalCard } from "@/components/products/new-arrival-card";
import type { Product } from "@/lib/types";

const SCROLL_GAP_PX = 24; // matches `gap-6`

/**
 * "Just landed" — full redesign from a 1+3 editorial grid to a horizontal
 * scroll carousel (client brief, 2026-08-31), Maria B/Sapphire "Most
 * Trending" style. One client component for header + scroller together,
 * deliberately: the arrow buttons live in the header row but drive the
 * scroller below it, and a ref created in one client component can't be
 * handed to a separate sibling — colocating both avoids that entirely
 * rather than working around it.
 *
 * Arrow disabled-state is IntersectionObserver-driven, not a scroll-
 * position calculation: two 1px sentinel `<li>`s bookend the real cards,
 * and each arrow disables exactly when its sentinel is fully visible
 * inside the scroller. That stays correct across every breakpoint's
 * different card width without this component ever needing to know it.
 */
export function NewArrivalsCarousel({ products }: { products: Product[] }) {
  const scrollerRef = useRef<HTMLUListElement>(null);
  const startSentinelRef = useRef<HTMLLIElement>(null);
  const endSentinelRef = useRef<HTMLLIElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const startEl = startSentinelRef.current;
    const endEl = endSentinelRef.current;
    if (!scroller || !startEl || !endEl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target === startEl) setAtStart(entry.isIntersecting);
          if (entry.target === endEl) setAtEnd(entry.isIntersecting);
        }
      },
      { root: scroller, threshold: 1 },
    );
    observer.observe(startEl);
    observer.observe(endEl);
    return () => observer.disconnect();
  }, [products.length]);

  const scrollByCard = (direction: 1 | -1) => {
    const scroller = scrollerRef.current;
    const card = scroller?.querySelector("li[data-card]");
    if (!scroller || !card) return;
    const width = card.getBoundingClientRect().width + SCROLL_GAP_PX;
    scroller.scrollBy({ left: direction * width, behavior: "smooth" });
  };

  if (products.length === 0) return null;

  return (
    <>
      <m.div
        className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 px-6 md:px-12 lg:px-20"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-purple-500">
            New Arrivals
          </p>
          <h2 className="mt-4 text-balance text-[clamp(1.5rem,3vw,2.5rem)] font-display font-extrabold leading-[1.02] tracking-[-0.03em] text-ink">
            Just landed.
          </h2>
        </div>

        <div className="flex items-center gap-6">
          <Link
            href="/new-in"
            className="label group inline-flex min-h-[44px] items-center gap-2 text-ink transition-colors duration-200 ease-state hover:text-purple-500"
          >
            <span className="relative">
              View all
              <span className="absolute -bottom-1.5 left-0 h-px w-full origin-left scale-x-0 bg-purple-500 transition-transform duration-300 ease-enter group-hover:scale-x-100" />
            </span>
            <span
              aria-hidden="true"
              className="transition-transform duration-200 ease-state group-hover:translate-x-0.5"
            >
              →
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollByCard(-1)}
              disabled={atStart}
              aria-label="Scroll left"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-hairline text-ink transition-colors duration-200 ease-state hover:border-ink disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft aria-hidden="true" size={18} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={() => scrollByCard(1)}
              disabled={atEnd}
              aria-label="Scroll right"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-hairline text-ink transition-colors duration-200 ease-state hover:border-ink disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronRight aria-hidden="true" size={18} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </m.div>

      <ul
        ref={scrollerRef}
        className="no-scrollbar mt-10 flex gap-6 overflow-x-auto px-6 pb-2 [scroll-snap-type:x_mandatory] scroll-smooth md:px-12 lg:px-20"
      >
        <li ref={startSentinelRef} aria-hidden="true" className="w-px shrink-0" />
        {products.map((product, index) => (
          <NewArrivalCard key={product.id} product={product} index={index} priority={index === 0} />
        ))}
        <li ref={endSentinelRef} aria-hidden="true" className="w-px shrink-0" />
      </ul>
    </>
  );
}
