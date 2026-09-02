"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { m, useAnimationFrame } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { NewArrivalCard } from "@/components/products/new-arrival-card";
import { Carousel3DCard, type Carousel3DBand } from "@/components/products/carousel-3d-card";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/cn";
import type { Product } from "@/lib/types";

const SCROLL_GAP_PX = 24; // matches `gap-6`, the flat fallback's own card gap
const AUTO_RESUME_MS = 3000;
const SWIPE_THRESHOLD_PX = 40;
const RING_DEGREES_PER_SECOND = 18; // 360deg / 20s

function bandFor(distance: number): Carousel3DBand {
  if (distance === 0) return { opacity: 1, scale: 1.05, brightness: 1 };
  if (distance <= 2) return { opacity: 0.6, scale: 0.85, brightness: 0.85 };
  return { opacity: 0.2, scale: 0.7, brightness: 0.6 };
}

/** Shortest signed distance from `index` to `activeIndex` around an N-card ring, in slots. */
function shortestDelta(index: number, activeIndex: number, total: number): number {
  let diff = index - activeIndex;
  const half = total / 2;
  if (diff > half) diff -= total;
  if (diff < -half) diff += total;
  return diff;
}

/**
 * "NEW ARRIVALS" eyebrow + "Just landed." + "View all →", unchanged copy
 * from the previous pass — per the brief's own "keep existing header row."
 * `after` is a slot for the flat fallback's inline scroll arrows only; the
 * 3D carousel's arrows live below the ring instead (see `Carousel3DRing`),
 * so it renders this with nothing in the slot.
 */
function SectionHeading({ after }: { after?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 px-6 md:px-12 lg:px-20">
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
        {after}
      </div>
    </div>
  );
}

const arrowButtonClass =
  "flex h-10 w-10 items-center justify-center rounded-full border border-hairline text-ink transition-colors duration-200 ease-state hover:border-ink disabled:cursor-not-allowed disabled:opacity-30";

/**
 * The pre-existing flat horizontal scroller — untouched from the previous
 * pass, and deliberately so: this is the `prefers-reduced-motion` fallback
 * the brief explicitly asks for ("show flat horizontal scroll instead —
 * fall back to the previous carousel design"), not a stripped-down version
 * of the 3D ring. Arrow disabled-state is IntersectionObserver-driven off
 * two 1px sentinel `<li>`s bookending the real cards.
 */
function FlatScrollCarousel({ products }: { products: Product[] }) {
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

  return (
    <>
      <SectionHeading
        after={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollByCard(-1)}
              disabled={atStart}
              aria-label="Scroll left"
              className={arrowButtonClass}
            >
              <ChevronLeft aria-hidden="true" size={18} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={() => scrollByCard(1)}
              disabled={atEnd}
              aria-label="Scroll right"
              className={arrowButtonClass}
            >
              <ChevronRight aria-hidden="true" size={18} strokeWidth={1.5} />
            </button>
          </div>
        }
      />

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

/**
 * The 360° ring itself — `perspective: 1200` on the stage, `preserve-3d` on
 * the ring, each card billboarded via `Carousel3DCard`'s own live-angle
 * formula (see its doc comment).
 *
 * **Rewritten 2026-09-02** — the previous version drove auto-spin with a
 * CSS `@keyframes` animation and manual rotation with a separate Framer
 * Motion `animate` target sharing the same element, switching which one
 * was "in control" by toggling a class. The two never shared state, so
 * there was nothing for either to hand off *from* — CSS doesn't expose its
 * live animated angle to JS, and Framer's tracked motion value had never
 * been told what that angle was. In practice the CSS animation, cards, and
 * JS were all fighting over the same `transform`, and the spin never
 * visibly ran. Replaced with one continuous source of truth: `rotationRef`
 * (a `useRef`, not `useState` — this updates every animation frame, and a
 * `setState` at 60fps would mean 60 renders a second) advanced by
 * `useAnimationFrame`, mirrored into `displayAngle` (a `useState`, so
 * React actually re-renders the cards with it) on every frame. Auto-spin,
 * arrow steps, card clicks and swipes all now mutate the exact same
 * `rotationRef` — there is only ever one number, so there is nothing left
 * to hand off between.
 *
 * `isHovering`/`isInteracting` are refs, not state — the animation-frame
 * callback reads them every frame, and putting them in state would mean a
 * render on every hover/interaction edge for a value the rAF loop only
 * ever *reads*, never displays.
 */
function Carousel3DRing({ products }: { products: Product[] }) {
  const stepDeg = 360 / products.length;
  const rotationRef = useRef(0);
  const isHovering = useRef(false);
  const isInteracting = useRef(false);
  const interactionTimer = useRef<number | null>(null);
  const pointerStartX = useRef<number | null>(null);
  const [displayAngle, setDisplayAngle] = useState(0);

  useAnimationFrame((_time, delta) => {
    if (isHovering.current || isInteracting.current) return;
    rotationRef.current -= (delta / 1000) * RING_DEGREES_PER_SECOND;
    setDisplayAngle(rotationRef.current);
  });

  const clearInteractionTimer = useCallback(() => {
    if (interactionTimer.current !== null) window.clearTimeout(interactionTimer.current);
  }, []);

  useEffect(() => clearInteractionTimer, [clearInteractionTimer]);

  /** Arrow/card/swipe interactions all funnel through here — one rotation, one resume timer. */
  const rotateBy = useCallback(
    (deltaDeg: number) => {
      isInteracting.current = true;
      rotationRef.current += deltaDeg;
      setDisplayAngle(rotationRef.current);
      clearInteractionTimer();
      interactionTimer.current = window.setTimeout(() => {
        isInteracting.current = false;
      }, AUTO_RESUME_MS);
    },
    [clearInteractionTimer],
  );

  // The front card, derived from the live angle rather than tracked
  // separately in its own piece of state — `displayAngle` is already the
  // single source of truth, so a second value that could drift out of
  // sync with it would be a bug waiting to happen, not a simplification.
  const activeIndex = useMemo(() => {
    const normalized = (((-displayAngle % 360) + 360) % 360) / stepDeg;
    return Math.round(normalized) % products.length;
  }, [displayAngle, stepDeg, products.length]);

  const step = useCallback((direction: 1 | -1) => rotateBy(-direction * stepDeg), [rotateBy, stepDeg]);

  const goToIndex = useCallback(
    (targetIndex: number) => {
      const delta = shortestDelta(targetIndex, activeIndex, products.length);
      rotateBy(-delta * stepDeg);
    },
    [activeIndex, products.length, stepDeg, rotateBy],
  );

  return (
    <>
      <div
        className="carousel-3d-stage relative mx-auto mt-10 h-[260px] w-full max-w-[960px] md:h-[320px] lg:h-[420px]"
        style={{ perspective: 1200 }}
        onMouseEnter={() => {
          isHovering.current = true;
        }}
        onMouseLeave={() => {
          isHovering.current = false;
        }}
        onPointerDown={(event) => {
          pointerStartX.current = event.clientX;
        }}
        onPointerUp={(event) => {
          if (pointerStartX.current === null) return;
          const delta = event.clientX - pointerStartX.current;
          pointerStartX.current = null;
          if (delta <= -SWIPE_THRESHOLD_PX) step(1);
          else if (delta >= SWIPE_THRESHOLD_PX) step(-1);
        }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(circle, rgba(124,42,232,0.05) 0%, transparent 70%)" }}
        />

        <div className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
          {products.map((product, index) => (
            <Carousel3DCard
              key={product.id}
              product={product}
              cardIndex={index}
              stepDeg={stepDeg}
              displayAngle={displayAngle}
              isActive={index === activeIndex}
              band={bandFor(Math.abs(shortestDelta(index, activeIndex, products.length)))}
              onFocusCard={goToIndex}
              priority={index === 0}
            />
          ))}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-4">
        <button type="button" onClick={() => step(-1)} aria-label="Previous product" className={arrowButtonClass}>
          <ChevronLeft aria-hidden="true" size={18} strokeWidth={1.5} />
        </button>

        <div className="flex items-center gap-2">
          {products.map((product, index) => (
            <button
              key={product.id}
              type="button"
              onClick={() => goToIndex(index)}
              aria-label={`Show ${product.name}`}
              aria-current={index === activeIndex || undefined}
              className={cn(
                "h-2 w-2 rounded-full transition-colors duration-200 ease-state",
                index === activeIndex ? "bg-purple-500" : "bg-hairline hover:bg-charcoal/40",
              )}
            />
          ))}
        </div>

        <button type="button" onClick={() => step(1)} aria-label="Next product" className={arrowButtonClass}>
          <ChevronRight aria-hidden="true" size={18} strokeWidth={1.5} />
        </button>
      </div>
    </>
  );
}

/**
 * "Just landed" (client brief, 2026-08-31) — a 360° auto-rotating 3D
 * carousel, CSS `transform`s only (no new library), Framer Motion for the
 * section-heading entrance and the manual-rotation spring only. Under
 * reduced motion this renders the previous pass's flat scroller instead,
 * per the brief's own explicit fallback instruction — untouched, not
 * reimplemented.
 */
export function NewArrivalsCarousel({ products }: { products: Product[] }) {
  const reducedMotion = usePrefersReducedMotion();

  if (products.length === 0) return null;

  if (reducedMotion) {
    return <FlatScrollCarousel products={products} />;
  }

  return (
    <m.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
      <SectionHeading />
      <Carousel3DRing products={products} />
    </m.div>
  );
}
