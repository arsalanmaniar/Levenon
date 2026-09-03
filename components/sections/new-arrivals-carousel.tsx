"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { m, useMotionValueEvent, useSpring } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { NewArrivalCard } from "@/components/products/new-arrival-card";
import { Carousel3DCard } from "@/components/products/carousel-3d-card";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/cn";
import type { Product } from "@/lib/types";

const SCROLL_GAP_PX = 24; // matches `gap-6`, the flat fallback's own card gap
/** Degrees of ring rotation per pixel dragged. Tuned by the brief; higher feels twitchy. */
const DRAG_SENSITIVITY = 0.25;
/** Past this much pointer travel, the gesture was a drag and any click it ends on is suppressed. */
const DRAG_CLICK_THRESHOLD_PX = 6;
const HINT_DISMISSED_KEY = "levenon_carousel_hint_seen";

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
 * from the previous pass — per an earlier brief's "keep existing header row."
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
 * The pre-existing flat horizontal scroller — untouched, and deliberately
 * so: this is the `prefers-reduced-motion` fallback an earlier brief
 * explicitly asks for ("show flat horizontal scroll instead — fall back to
 * the previous carousel design"), not a stripped-down version of the 3D
 * ring. Arrow disabled-state is IntersectionObserver-driven off two 1px
 * sentinel `<li>`s bookending the real cards.
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
 * The 360° ring — drag-driven only, no auto-spin.
 *
 * **Positioning rewritten 2026-09-03 to fix cards overlapping / z-fighting.**
 * The previous version kept every card billboarded toward the reader by
 * folding the ring's live angle into each card's own transform
 * (`rotateY(i·step − angle) translateZ(r) rotateY(−…)`), leaving the ring
 * itself unrotated. That flattened every card's plane parallel to the
 * screen, which is exactly the case `preserve-3d` cannot depth-sort: front
 * and back cards overlapped in screen space with no z difference to
 * separate them, and paint order came out arbitrary. Now the *ring*
 * rotates and each card keeps one fixed seat (`rotateY(i·step)
 * translateZ(r)`), so cards genuinely face outward, `translateZ` gives the
 * browser real depth to sort by, and `backface-visibility: hidden` drops
 * the far side entirely. This is also the arrangement the previous pass's
 * log flagged as impossible to combine with billboarding — the brief has
 * since chosen this side of that trade, and it is the side that fixes the
 * bug.
 *
 * `angle` is the committed target; `springAngle` animates toward it so a
 * release snaps smoothly. Framer holds that value outside React, so
 * `useMotionValueEvent` mirrors it into `renderAngle` state — a `setState`
 * per animated frame, but only while the spring is settling after a
 * release, not continuously. The cards need the live number to compute
 * their own depth shading, which is what makes the mirror necessary.
 */
function Carousel3DRing({ products }: { products: Product[] }) {
  const stepDeg = 360 / products.length;

  const [angle, setAngle] = useState(0);
  const [renderAngle, setRenderAngle] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(true);

  const springAngle = useSpring(0, { stiffness: 100, damping: 25 });
  useMotionValueEvent(springAngle, "change", setRenderAngle);
  useEffect(() => springAngle.set(angle), [angle, springAngle]);

  const dragStartX = useRef(0);
  const dragStartAngle = useRef(0);
  const isDragging = useRef(false);
  const dragDistance = useRef(0);

  // The hint is dismissed for the rest of the session after one real drag.
  // Read in an effect, not during render: `sessionStorage` doesn't exist on
  // the server, and defaulting to "dismissed" means it can only ever appear
  // after mount, never flash on and off during hydration.
  useEffect(() => {
    try {
      setHintDismissed(window.sessionStorage.getItem(HINT_DISMISSED_KEY) === "1");
    } catch {
      setHintDismissed(false);
    }
  }, []);

  const dismissHint = useCallback(() => {
    setHintDismissed(true);
    try {
      window.sessionStorage.setItem(HINT_DISMISSED_KEY, "1");
    } catch {
      // Private mode or blocked storage — the hint simply reappears next load.
    }
  }, []);

  /** Snap to the nearest card slot. */
  const snap = useCallback(
    (raw: number) => Math.round(raw / stepDeg) * stepDeg,
    [stepDeg],
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = true;
    dragDistance.current = 0;
    dragStartX.current = event.clientX;
    dragStartAngle.current = angle;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    const delta = event.clientX - dragStartX.current;
    dragDistance.current = Math.abs(delta);
    // Straight to the motion value, not through `setAngle` — during a drag
    // the ring should track the finger exactly, with no spring lag between
    // pointer and card. The spring only does its job on release.
    springAngle.jump(dragStartAngle.current + delta * DRAG_SENSITIVITY);
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    setDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);

    const delta = event.clientX - dragStartX.current;
    const snapped = snap(dragStartAngle.current + delta * DRAG_SENSITIVITY);
    setAngle(snapped);
    // Also set the spring directly, not only via `setAngle`'s effect: a drag
    // that ends back on the slot it started from leaves `angle` unchanged, so
    // that effect never re-runs — and the spring would sit at whatever
    // mid-slot position the last `jump` left it at, never snapping back.
    springAngle.set(snapped);
    if (dragDistance.current > DRAG_CLICK_THRESHOLD_PX) dismissHint();
  };

  // Right arrow advances to the *next* product. A card sits at the front
  // when `placement + angle ≡ 0`, so raising the index means lowering the
  // angle — hence the negation rather than a bare `+ direction`.
  const step = useCallback((direction: 1 | -1) => {
    setAngle((current) => current - direction * stepDeg);
  }, [stepDeg]);

  // The front card, derived from the live angle rather than tracked in its
  // own state — one source of truth, so a second value can't drift out of
  // sync with it. Normalised into `[0, 360)` before rounding: the raw angle
  // goes negative the moment the reader drags the other way, and a bare
  // `-angle % 360` would too.
  const activeIndex = useMemo(() => {
    const normalized = (((-renderAngle % 360) + 360) % 360) / stepDeg;
    return Math.round(normalized) % products.length;
  }, [renderAngle, stepDeg, products.length]);

  const goToIndex = useCallback(
    (targetIndex: number) => {
      const delta = shortestDelta(targetIndex, activeIndex, products.length);
      setAngle((current) => current - delta * stepDeg);
    },
    [activeIndex, products.length, stepDeg],
  );

  return (
    <>
      <div
        className={cn(
          "carousel-3d-stage relative mx-auto mt-10 flex h-[360px] w-full items-center justify-center overflow-hidden touch-none select-none lg:h-[480px]",
          dragging ? "cursor-grabbing" : "cursor-grab",
        )}
        // `overflow-hidden` is safe here specifically because this element
        // carries `perspective`, not `preserve-3d` — clipping a
        // `preserve-3d` element is what flattens its children's depth, and
        // that responsibility sits one level down on `.carousel-3d-ring`.
        style={{ perspective: 1000 }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        // A drag that happens to finish over a card must not also register as
        // a click on it. Capture phase, so this runs before the card's own
        // handler rather than racing it.
        onClickCapture={(event) => {
          if (dragDistance.current > DRAG_CLICK_THRESHOLD_PX) {
            event.preventDefault();
            event.stopPropagation();
          }
        }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(circle, rgba(124,42,232,0.05) 0%, transparent 70%)" }}
        />

        {/* The ring: exactly one card in size, centred by the flex stage,
            and the single element that actually rotates. */}
        <div
          className="carousel-3d-ring"
          style={{ transform: `rotateY(${renderAngle}deg)` }}
        >
          {products.map((product, index) => (
            <Carousel3DCard
              key={product.id}
              product={product}
              cardIndex={index}
              placementDeg={index * stepDeg}
              angleDeg={index * stepDeg + renderAngle}
              isActive={index === activeIndex}
              onFocusCard={goToIndex}
              priority={index === 0}
            />
          ))}
        </div>
      </div>

      {!hintDismissed && (
        <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-charcoal">
          Drag to explore
        </p>
      )}

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
 * "Just landed" — a drag-to-rotate 360° 3D carousel, CSS `transform`s only
 * (no new library), Framer Motion for the section entrance and the
 * release-snap spring. Under reduced motion this renders the flat scroller
 * instead, per an earlier brief's explicit fallback instruction — untouched,
 * not reimplemented.
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
