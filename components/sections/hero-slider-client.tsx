"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/cn";
import type { HeroCampaignAsset } from "@/lib/server/hero-assets";

export type HeroSlide = {
  label: string;
  headline: string;
  subtext: string;
  ctaLabel: string;
  ctaHref: string;
  imageAlt: string;
  /** Slide 3 only — the small "FREE DELIVERY" pill, top-right corner. */
  badge?: string;
  /** Slide 4 only — static "Offer ends in: N days", computed server-side. */
  countdownDays?: number;
  campaign: HeroCampaignAsset | null;
};

const AUTOPLAY_MS = 6000;
const SWIPE_THRESHOLD_PX = 50;
const TRANSITION_S = 0.8;

/**
 * Literal colours throughout this file, never the `--paper`/`--ink` tokens
 * (client brief, 2026-08-31 — this is the second and more direct fix for
 * the dark-theme-invisible-headline bug the last pass patched by pinning
 * the tokens instead). A full-bleed photo doesn't retint itself for a site
 * theme toggle, so the text sitting on it can't either — `text-white` is a
 * static Tailwind colour, not a custom property, so nothing here moves
 * when `data-theme` changes. The `#hero` token pin from the previous pass
 * stays in `globals.css` as a harmless second guard, but this component no
 * longer depends on it.
 */
const INK_HEX = "#0B0B0D";

/** Eyebrow → headline → subtext → CTA, each its own fade-up, staggered 0.15s apart. */
function TextBlockAnimated({ slide }: { slide: HeroSlide }) {
  return (
    <div className="max-w-[46ch]">
      <m.p
        className="mb-3 font-mono text-[11px] uppercase tracking-[0.3em] text-white/80"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0 }}
      >
        {slide.label}
      </m.p>
      <m.h1
        className="mb-2 text-balance text-[clamp(1.75rem,3.5vw,3.25rem)] font-display font-extrabold uppercase leading-[1.1] tracking-[-0.5px] text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        {slide.headline}
      </m.h1>
      <m.p
        className="mb-7 max-w-[38ch] font-sans text-sm text-white/70 md:ml-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        {slide.subtext}
      </m.p>
      {slide.countdownDays !== undefined && (
        <m.p
          className="mb-5 font-mono text-[11px] uppercase tracking-[0.2em] text-purple-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.38 }}
        >
          Offer ends in: {slide.countdownDays} {slide.countdownDays === 1 ? "day" : "days"}
        </m.p>
      )}
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.45 }}
      >
        <Link
          href={slide.ctaHref}
          className="inline-flex items-center justify-center rounded-none bg-white px-8 py-3 font-mono text-xs uppercase tracking-[0.15em] transition-colors duration-200 ease-state hover:bg-purple-500 hover:text-white"
          style={{ color: INK_HEX }}
        >
          {slide.ctaLabel}
        </Link>
      </m.div>
    </div>
  );
}

/** Same copy block, no motion — reduced-motion path renders instantly. */
function TextBlockStatic({ slide }: { slide: HeroSlide }) {
  return (
    <div className="max-w-[46ch]">
      <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.3em] text-white/80">
        {slide.label}
      </p>
      <h1 className="mb-2 text-balance text-[clamp(1.75rem,3.5vw,3.25rem)] font-display font-extrabold uppercase leading-[1.1] tracking-[-0.5px] text-white">
        {slide.headline}
      </h1>
      <p className="mb-7 max-w-[38ch] font-sans text-sm text-white/70 md:ml-auto">
        {slide.subtext}
      </p>
      {slide.countdownDays !== undefined && (
        <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.2em] text-purple-300">
          Offer ends in: {slide.countdownDays} {slide.countdownDays === 1 ? "day" : "days"}
        </p>
      )}
      <Link
        href={slide.ctaHref}
        className="inline-flex items-center justify-center rounded-none bg-white px-8 py-3 font-mono text-xs uppercase tracking-[0.15em] transition-colors duration-200 ease-state hover:bg-purple-500 hover:text-white"
        style={{ color: INK_HEX }}
      >
        {slide.ctaLabel}
      </Link>
    </div>
  );
}

/**
 * Full-bleed slide photograph — the whole point of this pass, replacing the
 * previous three passes' bounded/letterboxed product-photo panel entirely.
 * `hero-assets.ts` resolves a local file per slide (all five now exist —
 * see `hero-slider.tsx`'s doc comment for where they came from); a slide
 * that somehow has none renders a plain ink ground rather than a blank hole,
 * a defensive floor, not a second design.
 *
 * **No Ken Burns** (client brief, 2026-08-31) — the `scale: [1, 1.04]` pan
 * this pass shipped with was upscaling `next/image`'s already-fixed-size
 * output beyond its native resolution for the whole 6s hold, softening the
 * image. Static now: `object-cover` alone fills the frame at full source
 * quality, and the only motion left on the background is the slide-level
 * opacity crossfade in `HeroSliderClient` below, which this component has
 * no part in.
 */
function SlideBackground({
  campaign,
  alt,
  priority,
}: {
  campaign: HeroCampaignAsset | null;
  alt: string;
  priority: boolean;
}) {
  if (!campaign) {
    return <div className="absolute inset-0" style={{ backgroundColor: INK_HEX }} />;
  }

  return (
    <Image
      src={campaign.desktop}
      alt={alt}
      fill
      priority={priority}
      sizes="100vw"
      className="object-cover"
    />
  );
}

/** One full-bleed photograph, a right-side-weighted dark overlay, and the text block. */
function SlideContent({
  slide,
  priority,
  reducedMotion,
}: {
  slide: HeroSlide;
  priority: boolean;
  reducedMotion: boolean;
}) {
  return (
    <div className="relative h-full w-full overflow-hidden" style={{ backgroundColor: INK_HEX }}>
      <SlideBackground campaign={slide.campaign} alt={slide.imageAlt} priority={priority} />

      {/* Desktop overlay — dark on the right (where the text sits), clear on the left. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 hidden md:block"
        style={{
          background:
            "linear-gradient(to left, rgba(11,11,13,0.75) 0%, rgba(11,11,13,0.3) 40%, transparent 70%)",
        }}
      />
      {/* Mobile overlay — dark from the bottom, covering more of the frame so centred text stays readable. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 md:hidden"
        style={{
          background:
            "linear-gradient(to top, rgba(11,11,13,0.85) 0%, rgba(11,11,13,0.5) 35%, transparent 60%)",
        }}
      />

      {slide.badge && (
        <span className="absolute right-6 top-6 z-10 bg-purple-500 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-white md:right-12 lg:right-20">
          {slide.badge}
        </span>
      )}

      <div className="relative z-10 flex h-full w-full items-center justify-center px-6 text-center md:items-center md:justify-end md:px-0 md:text-right">
        <div className="md:pr-[clamp(2.5rem,8vw,7.5rem)]">
          {reducedMotion ? <TextBlockStatic slide={slide} /> : <TextBlockAnimated slide={slide} />}
        </div>
      </div>
    </div>
  );
}

/**
 * The hero, Maria B–style full-bleed rebuild (client brief, 2026-08-31,
 * twenty-first pass) — full history in `hero-slider.tsx`'s doc comment.
 * `hero-slider.tsx` hands down plain slide data; everything below is
 * presentation and state.
 *
 * Reduced motion branches the render tree rather than animating at
 * `duration: 0` — SKILL.md §7's rule is "never construct the animation".
 * Autoplay, the crossfade and the text stagger are all skipped outright;
 * manual navigation (arrows, swipe, line nav, keyboard) still works in both
 * branches. The background photo itself no longer animates either way —
 * see `SlideBackground`'s own doc comment.
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

  // Auto-play — 6s, paused on hover, never built at all under reduced motion.
  useEffect(() => {
    if (reducedMotion || paused || slides.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [reducedMotion, paused, slides.length]);

  const slide = slides[index];
  if (!slide) return null;

  const priority = index === 0;

  return (
    <section
      id="hero"
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
      className="relative h-[90vh] w-full touch-pan-y overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-inset"
      style={{ backgroundColor: INK_HEX }}
    >
      {reducedMotion ? (
        <div className="absolute inset-0">
          <SlideContent slide={slide} priority={priority} reducedMotion />
        </div>
      ) : (
        <AnimatePresence initial={false}>
          <m.div
            key={index}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: TRANSITION_S }}
          >
            <SlideContent slide={slide} priority={priority} reducedMotion={false} />
          </m.div>
        </AnimatePresence>
      )}

      {/* Arrows — right side, bottom area (Maria B's own placement, not centred). */}
      <div className="absolute bottom-24 right-6 z-20 hidden items-center gap-2 md:flex md:right-12 lg:right-20">
        <button
          type="button"
          onClick={prev}
          aria-label="Previous slide"
          className="flex h-9 w-9 items-center justify-center text-white/60 transition-colors duration-200 ease-state hover:text-white"
        >
          <ChevronLeft aria-hidden="true" size={20} strokeWidth={1.5} />
        </button>
        <button
          type="button"
          onClick={next}
          aria-label="Next slide"
          className="flex h-9 w-9 items-center justify-center text-white/60 transition-colors duration-200 ease-state hover:text-white"
        >
          <ChevronRight aria-hidden="true" size={20} strokeWidth={1.5} />
        </button>
      </div>

      {/* Line navigation, bottom-centre — segments, not dots. */}
      <div className="absolute inset-x-0 bottom-8 z-20 flex items-center justify-center gap-1.5">
        {slides.map((lineSlide, lineIndex) => (
          <button
            key={lineSlide.headline}
            type="button"
            onClick={() => goTo(lineIndex)}
            aria-label={`Go to slide ${lineIndex + 1}`}
            aria-current={lineIndex === index || undefined}
            className={cn(
              "h-[2px] transition-[width,background-color] duration-300 ease-state",
              lineIndex === index ? "w-10 bg-white" : "w-2 bg-white/40 hover:bg-white/60",
            )}
          />
        ))}
      </div>
    </section>
  );
}
