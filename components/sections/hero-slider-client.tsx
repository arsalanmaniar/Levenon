"use client";

import Image from "next/image";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, m, type Variants } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ThreadButton } from "@/components/ui/thread-button";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/cn";
import type { HeroCampaignAsset } from "@/lib/server/hero-assets";

export type HeroSlide = {
  eyebrow: string;
  headline: string;
  subtext: string;
  ctaLabel: string;
  ctaHref: string;
  photo: { url: string; alt: string; width: number; height: number };
  productName: string;
  price: string;
  /** Set only once real campaign photography exists — see `hero-assets.ts`. */
  campaign: HeroCampaignAsset | null;
};

const AUTOPLAY_MS = 5200;
const SWIPE_THRESHOLD_PX = 50;
const EASE = [0.25, 0.1, 0, 1] as const;
/** Ken Burns duration on the framed product photo — one slide's dwell, plus a little run-off. */
const PAN_S = AUTOPLAY_MS / 1000 + 1.5;

/**
 * Four fixed, hand-tuned gradients — never flat ink (client brief,
 * 2026-09-02). Literal hex, not the brand's semantic tokens: these are a
 * deliberately *dark* backdrop regardless of site theme, the same
 * "always-dark section" reasoning `.dark-section` already uses elsewhere,
 * and the brief specified exact values per slide, not a computed tint.
 * Index-matched to `hero-slider.tsx`'s `SLIDE_COPY` — 1 New Collection,
 * 2 Hand Embroidery, 3 Fabric First, 4 The Atelier.
 */
const SLIDE_GRADIENTS: Array<{ left: string; right: string }> = [
  {
    left: "linear-gradient(135deg, #1A0A2E 0%, #0B0B0D 50%, #0D0A1A 100%)",
    right: "linear-gradient(135deg, #150822 0%, #0B0B0D 60%)",
  },
  {
    left: "linear-gradient(135deg, #0B0B0D 0%, #1C0A0A 60%, #0B0B0D 100%)",
    right: "linear-gradient(135deg, #120808 0%, #0B0B0D 70%)",
  },
  {
    left: "linear-gradient(135deg, #0A1020 0%, #0B0B0D 50%, #0E1520 100%)",
    right: "linear-gradient(135deg, #080E1A 0%, #0B0B0D 70%)",
  },
  {
    left: "linear-gradient(135deg, #0F0A1A 0%, #1A0A30 30%, #0B0B0D 100%)",
    right: "linear-gradient(135deg, #0D0820 0%, #0B0B0D 70%)",
  },
];

const FRAME_IMAGE_SIZES = "(max-width: 767px) 100vw, 33vw";

/** Background crossfades slower than its content — "the background fades, content slides." */
const BG_VARIANTS: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 1.2, ease: "linear" } },
  exit: { opacity: 0, transition: { duration: 1.2, ease: "linear" } },
};

const TEXT_VARIANTS: Variants = {
  initial: { x: -40, opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { duration: 0.7, ease: EASE } },
  exit: { x: 40, opacity: 0, transition: { duration: 0.4, ease: EASE } },
};

const IMAGE_VARIANTS: Variants = {
  initial: { x: 60, opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { duration: 0.9, delay: 0.1, ease: EASE } },
  exit: { x: -40, opacity: 0, transition: { duration: 0.4, ease: EASE } },
};

/** Thin crop-mark corner, echoing an editorial contact sheet — persistent, not per-slide. */
function CornerBracket() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      aria-hidden="true"
      className="pointer-events-none absolute bottom-8 left-6 z-10 text-paper/20 md:left-12 lg:left-20"
    >
      <path d="M0 0 V40 H40" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

/** "0N / 04" — bottom-right of the left column, purple fill line resets and refills every autoplay dwell. */
function ProgressIndicator({
  index,
  total,
  reducedMotion,
}: {
  index: number;
  total: number;
  reducedMotion: boolean;
}) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <div className="absolute bottom-8 right-6 z-10 flex flex-col items-end gap-2 md:right-12 lg:right-20">
      <span className="font-mono text-[11px] tracking-[0.15em] text-paper/60">
        {pad(index + 1)} / {pad(total)}
      </span>
      <span className="block h-px w-[120px] overflow-hidden bg-paper/15">
        {reducedMotion ? (
          <span
            className="block h-px bg-purple-500"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        ) : (
          <m.span
            key={index}
            className="block h-px origin-left bg-purple-500"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: AUTOPLAY_MS / 1000, ease: "linear" }}
          />
        )}
      </span>
    </div>
  );
}

/** Word-by-word rise — each word rises out of an overflow-hidden mask, magazine-style. Skipped entirely under reduced motion. */
function AnimatedHeadline({ text, className }: { text: string; className: string }) {
  const words = text.split(" ");
  return (
    <h1 className={className}>
      {words.map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          <span className="inline-block overflow-hidden align-bottom">
            <m.span
              className="inline-block"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.08, ease: EASE }}
            >
              {word}
            </m.span>
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </h1>
  );
}

const HEADLINE_CLASS =
  "mt-4 max-w-[16ch] text-balance font-display text-[clamp(2.25rem,4.5vw,4.25rem)] font-extrabold leading-[1.05] tracking-[-1.5px] text-paper";

/** Animated text panel — eyebrow → headline (word rise) → subtext → CTA, each on its own delay. */
function TextPanelAnimated({ slide }: { slide: HeroSlide }) {
  return (
    <div className="max-w-[46ch]">
      <m.p
        className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.3em] text-purple-300"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0 }}
      >
        <span className="h-px w-7 bg-purple-500" aria-hidden="true" />
        {slide.eyebrow}
      </m.p>

      <AnimatedHeadline text={slide.headline} className={HEADLINE_CLASS} />

      <m.p
        className="mt-4 max-w-[38ch] font-sans text-[15px] text-paper/70"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        {slide.subtext}
      </m.p>

      <m.div
        className="mt-8"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.65 }}
      >
        <ThreadButton href={slide.ctaHref} tone="outline-invert" icon>
          {slide.ctaLabel}
        </ThreadButton>
      </m.div>
    </div>
  );
}

/** Same copy block, no motion — reduced-motion path renders instantly. */
function TextPanelStatic({ slide }: { slide: HeroSlide }) {
  return (
    <div className="max-w-[46ch]">
      <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.3em] text-purple-300">
        <span className="h-px w-7 bg-purple-500" aria-hidden="true" />
        {slide.eyebrow}
      </p>
      <h1 className={HEADLINE_CLASS}>{slide.headline}</h1>
      <p className="mt-4 max-w-[38ch] font-sans text-[15px] text-paper/70">{slide.subtext}</p>
      <div className="mt-8">
        <ThreadButton href={slide.ctaHref} tone="outline-invert" icon>
          {slide.ctaLabel}
        </ThreadButton>
      </div>
    </div>
  );
}

/**
 * The right-hand portrait frame — exactly 3:4, 65% of the column, on desktop
 * only ("mobile: full width, object-cover, no frame" per the brief). Shadow
 * defines the edge (no border); a 1px inset paper outline keeps the frame
 * legible against a background that is also dark.
 */
function FramedPhoto({
  slide,
  priority,
  reducedMotion,
}: {
  slide: HeroSlide;
  priority: boolean;
  reducedMotion: boolean;
}) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3">
      <div
        className={cn(
          "relative h-full w-full overflow-hidden md:aspect-[3/4] md:h-auto md:w-[65%]",
          "md:shadow-[0_40px_80px_rgba(11,11,13,0.6),inset_0_0_0_1px_rgba(251,250,248,0.2)]",
        )}
      >
        {reducedMotion ? (
          <Image
            src={slide.photo.url}
            alt={slide.photo.alt}
            fill
            priority={priority}
            sizes={FRAME_IMAGE_SIZES}
            className="object-cover"
          />
        ) : (
          <m.div
            className="absolute inset-0"
            initial={false}
            animate={{ scale: [1, 1.06] }}
            transition={{ duration: PAN_S, ease: "linear" }}
          >
            <Image
              src={slide.photo.url}
              alt={slide.photo.alt}
              fill
              priority={priority}
              sizes={FRAME_IMAGE_SIZES}
              className="object-cover"
            />
          </m.div>
        )}
      </div>
      <div className="hidden w-[65%] items-baseline justify-between md:flex">
        <span className="font-mono text-[11px] text-paper/60">{slide.productName}</span>
        <span className="font-mono text-[11px] text-purple-300">{slide.price}</span>
      </div>
    </div>
  );
}

/** Precise circle outline behind the frame — not a glow, a line. Persistent, desktop only. */
function DecorativeCircle() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-1/2 hidden h-[400px] w-[400px] rounded-full border border-paper/[0.06] md:block"
      style={{ transform: "translate(calc(-50% + 26px), calc(-50% - 26px))" }}
    />
  );
}

/**
 * Full-bleed treatment for once dedicated campaign photography exists — see
 * `hero-assets.ts`. Untouched by this pass's magazine-split redesign: no
 * asset has ever been supplied, so this branch has never rendered in
 * production, but the moment one lands the slide it belongs to should still
 * become the primary, full-bleed visual rather than falling back to a
 * portrait frame it doesn't need.
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
    <div className="relative h-full w-full overflow-hidden">
      <m.div
        className="absolute inset-0"
        initial={false}
        animate={reducedMotion ? undefined : { scale: [1, 1.035] }}
        transition={{ duration: PAN_S, ease: "linear" }}
      >
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
      </m.div>
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink/60 via-ink/10 to-transparent"
      />
      <div className="absolute inset-x-0 bottom-0">
        <div className="mx-auto max-w-shell px-6 pb-16 md:px-12 lg:px-20 md:pb-24">
          {reducedMotion ? <TextPanelStatic slide={slide} /> : <TextPanelAnimated slide={slide} />}
        </div>
      </div>
    </div>
  );
}

/**
 * The interactive hero (client brief, 2026-09-02, eighteenth pass — magazine
 * split-layout rebuild; full history in `hero-slider.tsx`'s doc comment).
 * `hero-slider.tsx` fetches products server-side and hands down plain slide
 * data; everything below is presentation and state.
 *
 * Reduced motion branches the render tree rather than animating at
 * `duration: 0` — SKILL.md §7's rule is "never construct the animation".
 * Autoplay, the crossfade, the Ken Burns pan and the word-by-word headline
 * reveal are all skipped outright; manual navigation (arrows, swipe,
 * keyboard) still works in both branches, and every visual element (the
 * gradients, the weave texture, the frame, the decorative circle/bracket)
 * renders identically either way — only the *motion* is conditional.
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

  // Auto-play — ~5s, paused on hover, never built at all under reduced motion.
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
  const gradients = SLIDE_GRADIENTS[index % SLIDE_GRADIENTS.length];

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
      className="relative h-[80vh] w-full touch-pan-y overflow-hidden bg-ink outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-inset md:h-[88vh]"
    >
      {slide.campaign ? (
        reducedMotion ? (
          <div className="absolute inset-0">
            <CampaignSlide slide={slide} priority={priority} reducedMotion />
          </div>
        ) : (
          <AnimatePresence initial={false}>
            <div key={index} className="absolute inset-0">
              <CampaignSlide slide={slide} priority={priority} reducedMotion={false} />
            </div>
          </AnimatePresence>
        )
      ) : (
        <div className="relative flex h-full w-full flex-col md:flex-row">
          {/* LEFT — editorial text column */}
          <div className="hero-weave relative order-2 h-[30vh] w-full overflow-hidden md:order-none md:h-full md:w-1/2">
            {reducedMotion ? (
              <>
                <div className="absolute inset-0" style={{ backgroundImage: gradients.left }} />
                <div className="relative z-10 flex h-full flex-col justify-center px-6 py-8 text-center md:items-start md:px-12 md:py-0 md:pl-[10%] md:text-left lg:px-20">
                  <TextPanelStatic slide={slide} />
                </div>
              </>
            ) : (
              <AnimatePresence initial={false}>
                <m.div
                  key={`bg-left-${index}`}
                  className="absolute inset-0"
                  style={{ backgroundImage: gradients.left }}
                  variants={BG_VARIANTS}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                />
                <m.div
                  key={`text-${index}`}
                  className="relative z-10 flex h-full flex-col justify-center px-6 py-8 text-center md:items-start md:px-12 md:py-0 md:pl-[10%] md:text-left lg:px-20"
                  variants={TEXT_VARIANTS}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <TextPanelAnimated slide={slide} />
                </m.div>
              </AnimatePresence>
            )}
            <CornerBracket />
            <ProgressIndicator index={index} total={slides.length} reducedMotion={reducedMotion} />
          </div>

          {/* RIGHT — framed portrait photo column */}
          <div className="relative order-1 h-[50vh] w-full overflow-hidden md:order-none md:h-full md:w-1/2">
            {reducedMotion ? (
              <>
                <div className="absolute inset-0" style={{ backgroundImage: gradients.right }} />
                <div className="relative z-10 h-full w-full">
                  <FramedPhoto slide={slide} priority={priority} reducedMotion />
                </div>
              </>
            ) : (
              <AnimatePresence initial={false}>
                <m.div
                  key={`bg-right-${index}`}
                  className="absolute inset-0"
                  style={{ backgroundImage: gradients.right }}
                  variants={BG_VARIANTS}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                />
                <m.div
                  key={`image-${index}`}
                  className="relative z-10 h-full w-full"
                  variants={IMAGE_VARIANTS}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <FramedPhoto slide={slide} priority={priority} reducedMotion={false} />
                </m.div>
              </AnimatePresence>
            )}
            <DecorativeCircle />
          </div>
        </div>
      )}

      {/* Arrows — `sm`+ only; a 48px hit target crowds a 320px viewport
          right against the swipe gesture that already covers mobile. */}
      <button
        type="button"
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-4 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-paper/30 bg-paper/10 text-paper backdrop-blur-md transition-colors duration-200 ease-state hover:bg-paper/20 sm:flex"
      >
        <ChevronLeft aria-hidden="true" size={22} strokeWidth={1.5} />
      </button>
      <button
        type="button"
        onClick={next}
        aria-label="Next slide"
        className="absolute right-4 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-paper/30 bg-paper/10 text-paper backdrop-blur-md transition-colors duration-200 ease-state hover:bg-paper/20 sm:flex"
      >
        <ChevronRight aria-hidden="true" size={22} strokeWidth={1.5} />
      </button>
    </section>
  );
}
