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
  eyebrow: string;
  headlineLines: [string, string];
  subtext: string;
  ctaLabel: string;
  ctaHref: string;
  photo: { url: string; alt: string; width: number; height: number };
  /** Set only once real campaign photography exists — see `hero-assets.ts`. */
  campaign: HeroCampaignAsset | null;
};

const AUTOPLAY_MS = 5000;
const SWIPE_THRESHOLD_PX = 50;
const IMAGE_SIZES = "(max-width: 767px) 90vw, 40vw";

/** Four fixed, rich gradients — one canvas per slide, never a two-tone split. */
const GRADIENTS = [
  "linear-gradient(135deg, #1A0535 0%, #0B0B0D 70%)",
  "linear-gradient(135deg, #0D1A35 0%, #0B0B0D 70%)",
  "linear-gradient(135deg, #1A0A0A 0%, #0B0B0D 70%)",
  "linear-gradient(135deg, #0A1A15 0%, #0B0B0D 70%)",
];

/** Eyebrow → headline → subtext → CTA, each its own fade-up, no word splitting. */
function TextBlockAnimated({ slide }: { slide: HeroSlide }) {
  return (
    <div className="max-w-[46ch]">
      <m.p
        className="mb-4 font-mono text-[11px] uppercase tracking-[0.25em] text-purple-300"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {slide.eyebrow}
      </m.p>
      <m.h1
        className="mb-4 text-balance text-[clamp(2rem,4vw,3.5rem)] font-display font-extrabold leading-[1.1] tracking-[-1px] text-paper"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {slide.headlineLines[0]}
        <br />
        {slide.headlineLines[1]}
      </m.h1>
      <m.p
        className="mb-8 max-w-[38ch] font-sans text-[15px] text-paper/65"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.35 }}
      >
        {slide.subtext}
      </m.p>
      <m.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <Link
          href={slide.ctaHref}
          className="inline-flex items-center justify-center border border-paper bg-transparent px-7 py-3.5 font-mono text-xs uppercase tracking-[0.18em] text-paper transition-colors duration-200 ease-state hover:bg-paper hover:text-ink"
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
      <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.25em] text-purple-300">
        {slide.eyebrow}
      </p>
      <h1 className="mb-4 text-balance text-[clamp(2rem,4vw,3.5rem)] font-display font-extrabold leading-[1.1] tracking-[-1px] text-paper">
        {slide.headlineLines[0]}
        <br />
        {slide.headlineLines[1]}
      </h1>
      <p className="mb-8 max-w-[38ch] font-sans text-[15px] text-paper/65">{slide.subtext}</p>
      <Link
        href={slide.ctaHref}
        className="inline-flex items-center justify-center border border-paper bg-transparent px-7 py-3.5 font-mono text-xs uppercase tracking-[0.18em] text-paper transition-colors duration-200 ease-state hover:bg-paper hover:text-ink"
      >
        {slide.ctaLabel}
      </Link>
    </div>
  );
}

/**
 * The garment, bottom-aligned on the right, full outfit head-to-toe visible
 * — never cropped into. Client brief, 2026-08-31: 80% of the slide's height,
 * width auto (the image's own aspect ratio decides it), capped at 40% of
 * the viewport on desktop. That rules out `fill` + a fixed box (the previous
 * pass's approach, which forces the *box*'s aspect ratio onto the photo):
 * here the `<Image>` carries its real intrinsic `width`/`height` and scales
 * itself via plain CSS (`h-[…] w-auto`), so a tall or a wide garment photo
 * both render at their own true proportions instead of being letterboxed
 * inside someone else's box. `vh`, not a `%` height, so the sizing doesn't
 * depend on an intermediate wrapper also carrying a definite height — the
 * Ken Burns `m.div` wrapper below never does.
 */
function ProductPanel({
  slide,
  priority,
  reducedMotion,
}: {
  slide: HeroSlide;
  priority: boolean;
  reducedMotion: boolean;
}) {
  const image = (
    <>
      {/* Sized to hug the photo's own rendered box (its parent is a
          shrink-to-fit flex/motion child, never stretched), so the glow
          wraps the garment itself rather than ballooning to the size of
          the whole right-hand column. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[-15%] -z-10 rounded-full bg-purple-500/30 blur-[100px]"
      />
      <Image
        src={slide.photo.url}
        alt={slide.photo.alt}
        width={slide.photo.width}
        height={slide.photo.height}
        priority={priority}
        sizes={IMAGE_SIZES}
        className="h-[42vh] w-auto max-w-full object-contain md:h-[80vh] md:max-w-[40vw]"
      />
    </>
  );

  return (
    <div className="relative flex h-[50vh] w-full shrink-0 items-center justify-center md:absolute md:inset-y-0 md:right-0 md:h-full md:w-1/2 md:items-end md:justify-center md:pr-6 lg:pr-12">
      {reducedMotion ? (
        <div className="relative">{image}</div>
      ) : (
        <m.div
          className="relative"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          {image}
        </m.div>
      )}
    </div>
  );
}

/**
 * Full-bleed treatment for once dedicated campaign photography exists — see
 * `hero-assets.ts`. Untouched by this pass's rewrite in spirit: no asset has
 * ever been supplied (this branch has never rendered in production), but
 * the moment one lands the slide it belongs to should still take over as
 * the primary visual rather than falling back to a product photo it
 * doesn't need.
 */
function CampaignSlide({
  slide,
  priority,
  reducedMotion,
}: {
  slide: HeroSlide;
  priority: boolean;
  reducedMotion: boolean;
}) {
  const campaign = slide.campaign as HeroCampaignAsset;
  return (
    <div className="relative h-full w-full overflow-hidden bg-ink">
      <Image
        src={campaign.desktop}
        alt={slide.photo.alt}
        fill
        priority={priority}
        sizes="100vw"
        className="hidden object-cover md:block"
      />
      <Image
        src={campaign.mobile ?? campaign.desktop}
        alt={slide.photo.alt}
        fill
        priority={priority}
        sizes="100vw"
        className="object-cover md:hidden"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink/60 via-ink/10 to-transparent"
      />
      <div className="absolute inset-x-0 bottom-0">
        <div className="mx-auto max-w-shell px-6 pb-16 md:px-12 lg:px-20 md:pb-24">
          {reducedMotion ? <TextBlockStatic slide={slide} /> : <TextBlockAnimated slide={slide} />}
        </div>
      </div>
    </div>
  );
}

/** One full-bleed gradient canvas: text left, garment right (top/bottom stacked on mobile). */
function SlideContent({
  slide,
  gradient,
  priority,
  reducedMotion,
}: {
  slide: HeroSlide;
  gradient: string;
  priority: boolean;
  reducedMotion: boolean;
}) {
  if (slide.campaign) {
    return <CampaignSlide slide={slide} priority={priority} reducedMotion={reducedMotion} />;
  }

  return (
    <div className="relative h-full w-full" style={{ backgroundImage: gradient }}>
      <div className="flex h-full w-full flex-col md:block">
        <ProductPanel slide={slide} priority={priority} reducedMotion={reducedMotion} />
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center md:absolute md:inset-y-0 md:left-0 md:w-1/2 md:items-start md:justify-center md:pl-[clamp(2rem,6vw,6rem)] md:pr-6 md:text-left">
          {reducedMotion ? <TextBlockStatic slide={slide} /> : <TextBlockAnimated slide={slide} />}
        </div>
      </div>
    </div>
  );
}

/**
 * The hero, rebuilt from scratch (client brief, 2026-08-30, nineteenth pass)
 * — full history in `hero-slider.tsx`'s doc comment. `hero-slider.tsx`
 * fetches products server-side and hands down plain slide data; everything
 * below is presentation and state.
 *
 * Deliberately simple per this brief: one crossfade at the slide level
 * (opacity only, no x/y that could break layout), a plain fade-up per text
 * element and a single slide-in for the product photo — no word-by-word
 * splitting, no independently-timed background layer.
 *
 * Reduced motion branches the render tree rather than animating at
 * `duration: 0` — SKILL.md §7's rule is "never construct the animation".
 * Autoplay and every entrance/crossfade animation are skipped outright;
 * manual navigation (arrows, swipe, dots, keyboard) still works in both
 * branches.
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

  // Auto-play — 5s, paused on hover, never built at all under reduced motion.
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
  const gradient = GRADIENTS[index % GRADIENTS.length];

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
      className="relative h-[85vh] w-full touch-pan-y overflow-hidden bg-ink outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-inset md:h-[100vh]"
    >
      {reducedMotion ? (
        <div className="absolute inset-0">
          <SlideContent slide={slide} gradient={gradient} priority={priority} reducedMotion />
        </div>
      ) : (
        <AnimatePresence initial={false}>
          <m.div
            key={index}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <SlideContent slide={slide} gradient={gradient} priority={priority} reducedMotion={false} />
          </m.div>
        </AnimatePresence>
      )}

      {/* Arrows — desktop only, swipe covers mobile. */}
      <button
        type="button"
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-6 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-paper/15 text-paper backdrop-blur-sm transition-colors duration-200 ease-state hover:bg-paper/30 md:flex"
      >
        <ChevronLeft aria-hidden="true" size={18} strokeWidth={1.5} />
      </button>
      <button
        type="button"
        onClick={next}
        aria-label="Next slide"
        className="absolute right-6 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-paper/15 text-paper backdrop-blur-sm transition-colors duration-200 ease-state hover:bg-paper/30 md:flex"
      >
        <ChevronRight aria-hidden="true" size={18} strokeWidth={1.5} />
      </button>

      {/* Progress dots — one per slide (four, not a fixed five). */}
      <div className="absolute inset-x-0 bottom-6 z-20 flex items-center justify-center gap-2">
        {slides.map((dotSlide, dotIndex) => (
          <button
            key={dotSlide.headlineLines.join("-")}
            type="button"
            onClick={() => goTo(dotIndex)}
            aria-label={`Go to slide ${dotIndex + 1}`}
            aria-current={dotIndex === index || undefined}
            className={cn(
              "h-1.5 rounded-full transition-[width,background-color] duration-300 ease-state",
              dotIndex === index ? "w-5 bg-paper" : "w-1.5 bg-paper/30 hover:bg-paper/50",
            )}
          />
        ))}
      </div>
    </section>
  );
}
