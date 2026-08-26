"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ThreadButton } from "@/components/ui/thread-button";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/cn";

export type HeroSlide = {
  imageUrl: string;
  imageAlt: string;
  eyebrow: string;
  headline: string;
  subtext: string;
  ctaLabel: string;
  ctaHref: string;
};

const AUTOPLAY_MS = 5000;
const SWIPE_THRESHOLD_PX = 50;
const ENTRANCE_EASE = [0.16, 1, 0.3, 1] as const;

/** Image, gradient and bottom-left copy — identical in both the animated and reduced-motion branches below. */
function SlideContent({ slide, priority }: { slide: HeroSlide; priority: boolean }) {
  return (
    <>
      <Image
        src={slide.imageUrl}
        alt={slide.imageAlt}
        fill
        priority={priority}
        sizes="100vw"
        className="object-cover"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-ink/50 via-ink/10 to-transparent"
      />

      <div className="absolute inset-x-0 bottom-0">
        <div className="mx-auto max-w-shell px-6 pb-16 md:px-12 lg:px-20 md:pb-24">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-purple-300">
            {slide.eyebrow}
          </p>
          <h1 className="mt-4 max-w-[20ch] text-balance font-display text-[clamp(2.25rem,5vw,4.5rem)] font-extrabold leading-[0.98] tracking-[-0.02em] text-paper">
            {slide.headline}
          </h1>
          <p className="mt-4 max-w-[46ch] truncate font-sans text-[15px] text-paper/80">
            {slide.subtext}
          </p>
          <div className="mt-8">
            <ThreadButton href={slide.ctaHref} tone="outline-invert" icon>
              {slide.ctaLabel}
            </ThreadButton>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * The interactive half of the hero slider (client brief, 2026-08-30, Item
 * 1) — `hero-slider.tsx` fetches the three named products server-side and
 * hands down plain slide data; everything below is presentation and state,
 * the same "server fetches, client animates" split every other section on
 * this site already uses.
 *
 * Reduced motion branches the render tree rather than animating at
 * `duration: 0` — SKILL.md §7's rule is "never construct the animation",
 * not "construct it instantly" (a distinction this codebase's own spec log
 * already flags `cart-drawer.tsx` for getting wrong). Auto-play is also
 * skipped outright under reduced motion, per the brief; manual navigation
 * (arrows, dots, swipe, keyboard) still works in both branches.
 */
export function HeroSliderClient({ slides }: { slides: HeroSlide[] }) {
  const reducedMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const pointerStartX = useRef<number | null>(null);

  const goTo = useCallback(
    (next: number) => {
      setIndex(((next % slides.length) + slides.length) % slides.length);
    },
    [slides.length],
  );
  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  // Auto-play — every 5s, paused on hover, never built at all under
  // reduced motion.
  useEffect(() => {
    if (reducedMotion || paused || slides.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [reducedMotion, paused, slides.length]);

  const slide = slides[index];
  if (!slide) return null;

  return (
    <section
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured collections"
      tabIndex={0}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          prev();
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          next();
        }
      }}
      onPointerDown={(event) => {
        pointerStartX.current = event.clientX;
      }}
      onPointerUp={(event) => {
        if (pointerStartX.current === null) return;
        const delta = event.clientX - pointerStartX.current;
        pointerStartX.current = null;
        if (delta <= -SWIPE_THRESHOLD_PX) next();
        else if (delta >= SWIPE_THRESHOLD_PX) prev();
      }}
      className="relative h-[70vh] w-full touch-pan-y overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-inset md:h-[85vh]"
    >
      {reducedMotion ? (
        <div className="absolute inset-0">
          <SlideContent slide={slide} priority={index === 0} />
        </div>
      ) : (
        // `initial={false}` on AnimatePresence — without it the very first
        // slide (server-rendered, LCP-critical h1 and all) fades in from
        // opacity 0 on mount instead of simply being there, which both
        // delays LCP and produces the flash Reveal's own doc comment
        // warns against for above-the-fold content. Later slide changes
        // still play their own `initial`/`animate` normally — this only
        // suppresses the mount-time one.
        <AnimatePresence initial={false}>
          <m.div
            key={index}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: ENTRANCE_EASE }}
            className="absolute inset-0"
          >
            <SlideContent slide={slide} priority={index === 0} />
          </m.div>
        </AnimatePresence>
      )}

      {/* Arrows — `sm`+ only; a 48px hit target crowds a 320px viewport
          right against the swipe gesture that already covers mobile. */}
      <button
        type="button"
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-4 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-paper/30 bg-paper/20 text-paper backdrop-blur-md transition-colors duration-200 ease-state hover:bg-paper/30 sm:flex"
      >
        <ChevronLeft aria-hidden="true" size={22} strokeWidth={1.5} />
      </button>
      <button
        type="button"
        onClick={next}
        aria-label="Next slide"
        className="absolute right-4 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-paper/30 bg-paper/20 text-paper backdrop-blur-md transition-colors duration-200 ease-state hover:bg-paper/30 sm:flex"
      >
        <ChevronRight aria-hidden="true" size={22} strokeWidth={1.5} />
      </button>

      {/* Dots — bottom-centre, active 24px / inactive 8px, width-animated. */}
      <div className="absolute inset-x-0 bottom-6 z-10 flex items-center justify-center gap-2">
        {slides.map((dotSlide, dotIndex) => (
          <button
            key={dotSlide.headline}
            type="button"
            onClick={() => goTo(dotIndex)}
            aria-label={`Go to slide ${dotIndex + 1}`}
            aria-current={dotIndex === index || undefined}
            className={cn(
              "h-2 rounded-full transition-[width,background-color] duration-300 ease-state",
              dotIndex === index ? "w-6 bg-paper" : "w-2 bg-paper/40 hover:bg-paper/60",
            )}
          />
        ))}
      </div>
    </section>
  );
}
