"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/cn";

export type HeroSlide = {
  label: string;
  headline: [string, string];
  subtext: string;
  ctaLabel: string;
  ctaHref: string;
  /** Slide 3 only — the small "FREE DELIVERY" pill, top-right corner. */
  badge?: string;
  /** Slide 5 only — the one paper-background slide; everything else is dark. */
  light?: boolean;
};

const AUTOPLAY_MS = 6000;
const SWIPE_THRESHOLD_PX = 50;
const TRANSITION_S = 0.8;

/**
 * Literal colours throughout this file, never the `--paper`/`--ink` tokens
 * — the rule the last two passes established for the hero, extended here
 * to a slide that's the *opposite* polarity. `--ink`/`--paper` swap
 * globally with `data-theme`; slide 5's background is a fixed, literal
 * `#FBFAF8` regardless of site theme (see `background` below), so its text
 * has to be equally fixed. Using the token classes here (`text-ink` on a
 * background that's `bg-paper`-shaped) would look right in light theme and
 * silently invert to near-white-on-near-white the moment a reader is in
 * dark site-theme — the exact bug class the last pass fixed, mirrored.
 */
const INK_HEX = "#0B0B0D";
const CHARCOAL_HEX = "#5B5A5F";
const PAPER_HEX = "#FBFAF8";
const PURPLE_500 = "#7C2AE8";
const PURPLE_300 = "#B98CF2";
const GOLD_HEX = "#D4AF37";

/** One canvas per slide — never flat, never a photo. Index-matched to `hero-slider.tsx`. */
const BACKGROUNDS = [
  "linear-gradient(135deg, #1A0535 0%, #0B0B0D 60%, #0D0520 100%)",
  "linear-gradient(135deg, #0D1A35 0%, #0B0B0D 70%)",
  "linear-gradient(135deg, #1A0A0A 0%, #0B0B0D 60%, #1A0A20 100%)",
  "linear-gradient(135deg, #0A1520 0%, #0B0B0D 60%)",
  PAPER_HEX,
];

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function polygonPoints(cx: number, cy: number, radius: number, sides: number): string {
  const points: string[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
    points.push(`${(cx + radius * Math.cos(angle)).toFixed(1)},${(cy + radius * Math.sin(angle)).toFixed(1)}`);
  }
  return points.join(" ");
}

/** Slide 1 "The Edit" — two orbiting rings, a faint "01", three diagonal hairlines. */
function Visual1() {
  return (
    <div className="relative flex h-[500px] w-[500px] items-center justify-center">
      <div
        className="hero-orbit-a absolute h-[500px] w-[500px] rounded-full"
        style={{ border: `1px solid ${hexToRgba(PURPLE_500, 0.4)}` }}
        aria-hidden="true"
      />
      <div
        className="hero-orbit-b absolute h-[300px] w-[300px] rounded-full"
        style={{ border: `1px solid ${hexToRgba(PURPLE_300, 0.3)}` }}
        aria-hidden="true"
      />
      <span
        className="absolute select-none font-display font-extrabold"
        style={{ fontSize: 180, color: hexToRgba(PURPLE_500, 0.15) }}
        aria-hidden="true"
      >
        01
      </span>
      <svg className="absolute h-[500px] w-[500px]" viewBox="0 0 500 500" aria-hidden="true">
        <g transform="rotate(45 250 250)" stroke={hexToRgba(PURPLE_300, 0.2)} strokeWidth="1">
          <line x1="-100" y1="150" x2="600" y2="150" />
          <line x1="-100" y1="250" x2="600" y2="250" />
          <line x1="-100" y1="350" x2="600" y2="350" />
        </g>
      </svg>
    </div>
  );
}

/** Slide 2 "The Thread" — a needle, six stitches, a self-drawing unravelling thread. */
function Visual2({ reducedMotion }: { reducedMotion: boolean }) {
  const stitchYs = [107, 164, 221, 279, 336, 393];
  return (
    <div className="relative flex h-[500px] w-[320px] items-center justify-center">
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(${hexToRgba(PURPLE_300, 0.08)} 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
        }}
      />
      <svg className="relative h-[500px] w-[300px]" viewBox="0 0 300 500" fill="none" aria-hidden="true">
        <ellipse cx="150" cy="40" rx="20" ry="10" stroke={PURPLE_500} strokeWidth="1.5" />
        <line x1="150" y1="50" x2="150" y2="450" stroke={hexToRgba(PURPLE_300, 0.6)} strokeWidth="2" />
        {stitchYs.map((y) => (
          <line key={y} x1="140" y1={y} x2="160" y2={y} stroke={hexToRgba(PURPLE_300, 0.4)} strokeWidth="2" />
        ))}
        <m.path
          d="M150 450 C 118 468, 182 480, 150 495 S 122 512, 150 500"
          stroke={hexToRgba(PURPLE_500, 0.5)}
          strokeWidth="1.5"
          initial={reducedMotion ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={reducedMotion ? { duration: 0 } : { duration: 3, ease: "easeInOut" }}
        />
      </svg>
    </div>
  );
}

/** Slide 3 "Eid Offer" — 8 radiating lines, 3 octagons, a pulsing centre, four gold diamonds. */
function Visual3() {
  const center = 200;
  const lines = Array.from({ length: 8 }, (_, i) => {
    const angle = (Math.PI * 2 * i) / 8;
    return {
      key: i,
      x2: center + 200 * Math.cos(angle),
      y2: center + 200 * Math.sin(angle),
    };
  });
  const diamonds = [
    { x: center, y: center - 150 },
    { x: center + 150, y: center },
    { x: center, y: center + 150 },
    { x: center - 150, y: center },
  ];
  return (
    <div className="relative flex h-[400px] w-[400px] items-center justify-center">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 400" aria-hidden="true">
        {lines.map((l) => (
          <line key={l.key} x1={center} y1={center} x2={l.x2} y2={l.y2} stroke={hexToRgba(PURPLE_500, 0.3)} strokeWidth="1" />
        ))}
        <polygon points={polygonPoints(center, center, 150, 8)} fill="none" stroke={hexToRgba(PURPLE_300, 0.2)} strokeWidth="1" />
        <polygon points={polygonPoints(center, center, 100, 8)} fill="none" stroke={hexToRgba(PURPLE_300, 0.2)} strokeWidth="1" />
        <polygon points={polygonPoints(center, center, 50, 8)} fill="none" stroke={hexToRgba(PURPLE_300, 0.2)} strokeWidth="1" />
      </svg>
      <span
        aria-hidden="true"
        className="hero-pulse-dot absolute h-3 w-3 rounded-full"
        style={{ backgroundColor: PURPLE_500 }}
      />
      {diamonds.map((d, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="absolute h-2 w-2 rotate-45"
          style={{ left: d.x - 4, top: d.y - 4, backgroundColor: hexToRgba(GOLD_HEX, 0.4) }}
        />
      ))}
    </div>
  );
}

/** Slide 4 "The Fabric" — three overlapping textured swatches, a fabric caption. */
function Visual4() {
  const swatches = [
    { rotate: -8, x: -40, y: -20, bg: hexToRgba("#5B1A9E", 0.4), border: hexToRgba(PURPLE_500, 0.6) },
    { rotate: 0, x: 0, y: 0, bg: hexToRgba("#1A0535", 0.6), border: hexToRgba(PURPLE_300, 0.4) },
    { rotate: 6, x: 30, y: 10, bg: INK_HEX, border: hexToRgba(PURPLE_500, 0.3) },
  ];
  return (
    <div className="flex flex-col items-center gap-10">
      <div className="relative h-[260px] w-[220px]" aria-hidden="true">
        {swatches.map((s, i) => (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 h-[220px] w-[160px]"
            style={{
              transform: `translate(-50%, -50%) translate(${s.x}px, ${s.y}px) rotate(${s.rotate}deg)`,
              backgroundColor: s.bg,
              border: `1px solid ${s.border}`,
              backgroundImage: `repeating-linear-gradient(45deg, ${hexToRgba(PAPER_HEX, 0.03)} 0px, ${hexToRgba(PAPER_HEX, 0.03)} 1px, transparent 1px, transparent 2px)`,
            }}
          />
        ))}
      </div>
      <p
        className="whitespace-nowrap font-mono text-[10px] uppercase"
        style={{ color: hexToRgba(PURPLE_300, 0.6), letterSpacing: "0.3em" }}
      >
        Lawn · Chiffon · Silk · Organza
      </p>
    </div>
  );
}

/** Slide 5 "The Brand" — a giant faint "L", the wordmark's own ring motif, "Est. 2024". */
function Visual5() {
  return (
    <div className="relative flex h-[400px] w-[400px] items-center justify-center">
      <span
        aria-hidden="true"
        className="absolute select-none font-display font-extrabold leading-none"
        style={{ fontSize: 400, color: hexToRgba(INK_HEX, 0.06) }}
      >
        L
      </span>
      <div className="relative flex flex-col items-center gap-5">
        <svg className="hero-orbit-ring h-[200px] w-[200px]" viewBox="0 0 100 125" fill="none" aria-hidden="true">
          <circle cx="50" cy="62.5" r="26" stroke={PURPLE_500} strokeWidth="1" strokeOpacity="0.85" />
          <path d="M50 36.5a26 26 0 0 1 26 26" stroke={PURPLE_500} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span className="font-mono text-[11px] tracking-[0.18em]" style={{ color: CHARCOAL_HEX }}>
          Est. 2024
        </span>
      </div>
    </div>
  );
}

/** Wraps whichever `Visual*` belongs to this slide in the shared entrance animation. */
function SlideVisual({ index, reducedMotion }: { index: number; reducedMotion: boolean }) {
  const content =
    index === 0 ? (
      <Visual1 />
    ) : index === 1 ? (
      <Visual2 reducedMotion={reducedMotion} />
    ) : index === 2 ? (
      <Visual3 />
    ) : index === 3 ? (
      <Visual4 />
    ) : (
      <Visual5 />
    );

  if (reducedMotion) {
    return <div className="relative flex items-center justify-center">{content}</div>;
  }

  return (
    <m.div
      className="relative flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.2 }}
    >
      {content}
    </m.div>
  );
}

/** Eyebrow → headline → subtext → CTA, each its own fade-up, staggered 0.15s apart. */
function TextBlockAnimated({ slide }: { slide: HeroSlide }) {
  const light = slide.light;
  return (
    <div className="max-w-[46ch] text-center md:text-left">
      <m.p
        className={cn(
          "mb-3 font-mono text-[11px] uppercase tracking-[0.3em]",
          light ? "text-[#5B5A5F]" : "text-white/80",
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0 }}
      >
        {slide.label}
      </m.p>
      <m.h1
        className={cn(
          "mb-2 text-balance text-[clamp(1.75rem,3.5vw,3.25rem)] font-display font-extrabold uppercase leading-[1.1] tracking-[-0.5px]",
          light ? "text-[#0B0B0D]" : "text-white",
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        {slide.headline[0]}
        <br />
        {slide.headline[1]}
      </m.h1>
      <m.p
        className={cn(
          "mx-auto mb-7 max-w-[38ch] font-sans text-sm md:mx-0",
          light ? "text-[#5B5A5F]" : "text-white/70",
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        {slide.subtext}
      </m.p>
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.45 }}
      >
        <Link href={slide.ctaHref} className={ctaClass(light)}>
          {slide.ctaLabel}
        </Link>
      </m.div>
    </div>
  );
}

/** Same copy block, no motion — reduced-motion path renders instantly. */
function TextBlockStatic({ slide }: { slide: HeroSlide }) {
  const light = slide.light;
  return (
    <div className="max-w-[46ch] text-center md:text-left">
      <p
        className={cn(
          "mb-3 font-mono text-[11px] uppercase tracking-[0.3em]",
          light ? "text-[#5B5A5F]" : "text-white/80",
        )}
      >
        {slide.label}
      </p>
      <h1
        className={cn(
          "mb-2 text-balance text-[clamp(1.75rem,3.5vw,3.25rem)] font-display font-extrabold uppercase leading-[1.1] tracking-[-0.5px]",
          light ? "text-[#0B0B0D]" : "text-white",
        )}
      >
        {slide.headline[0]}
        <br />
        {slide.headline[1]}
      </h1>
      <p
        className={cn(
          "mx-auto mb-7 max-w-[38ch] font-sans text-sm md:mx-0",
          light ? "text-[#5B5A5F]" : "text-white/70",
        )}
      >
        {slide.subtext}
      </p>
      <Link href={slide.ctaHref} className={ctaClass(light)}>
        {slide.ctaLabel}
      </Link>
    </div>
  );
}

function ctaClass(light: boolean | undefined): string {
  const base =
    "inline-flex items-center justify-center rounded-none px-8 py-3 font-mono text-xs uppercase tracking-[0.15em] transition-colors duration-200 ease-state";
  return light
    ? cn(base, "border border-[#0B0B0D] text-[#0B0B0D] hover:bg-[#0B0B0D] hover:text-[#FBFAF8]")
    : cn(base, "bg-white text-[#0B0B0D] hover:bg-purple-500 hover:text-white");
}

/** One CSS/SVG canvas, an optional top-right offer badge, and the text block. */
function SlideContent({
  slide,
  index,
  reducedMotion,
}: {
  slide: HeroSlide;
  index: number;
  reducedMotion: boolean;
}) {
  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: BACKGROUNDS[index] }}>
      {slide.badge && (
        <span className="absolute right-6 top-6 z-10 bg-purple-500 px-4 py-2 text-center font-mono text-[10px] uppercase tracking-[0.15em] text-white md:right-12 lg:right-20">
          {slide.badge}
        </span>
      )}

      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-10 px-6 md:flex-row md:justify-between md:gap-0 md:px-0">
        <div className="order-2 md:order-1 md:w-3/5 md:pl-[clamp(2rem,6vw,6rem)]">
          {reducedMotion ? <TextBlockStatic slide={slide} /> : <TextBlockAnimated slide={slide} />}
        </div>
        <div className="order-1 hidden h-full md:order-2 md:flex md:w-2/5 md:items-center md:justify-center">
          <SlideVisual index={index} reducedMotion={reducedMotion} />
        </div>
      </div>
    </div>
  );
}

/**
 * The hero, rebuilt pure CSS/SVG (client brief, 2026-08-31, twenty-second
 * pass) — full history in `hero-slider.tsx`'s doc comment. No `<Image>`
 * anywhere in this file, no photography dependency of any kind: every
 * slide's right-side visual is hand-drawn geometry (`Visual1`–`Visual5`
 * above), and every slide's background is a literal CSS gradient (or, for
 * slide 5, a flat paper hex).
 *
 * Reduced motion branches the render tree rather than animating at
 * `duration: 0` — SKILL.md §7's rule is "never construct the animation".
 * Autoplay, the crossfade, the text stagger and each visual's entrance are
 * all skipped outright under reduced motion; the always-running CSS
 * rotations/pulse (`.hero-orbit-*`, `.hero-pulse-dot` in `globals.css`) are
 * guarded by their own `@media (prefers-reduced-motion: no-preference)`
 * rule, so they need no JS branch here at all. Manual navigation (arrows,
 * swipe, line nav, keyboard) works in both branches.
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

  // Slide 5 is the one paper-background slide — the fixed nav chrome (arrows,
  // line indicators) has to flip to a dark colour there or it disappears.
  const chromeHex = slide.light ? INK_HEX : "#FFFFFF";
  const chromeHoverHex = slide.light ? "#000000" : "#FFFFFF";

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
          <SlideContent slide={slide} index={index} reducedMotion />
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
            <SlideContent slide={slide} index={index} reducedMotion={false} />
          </m.div>
        </AnimatePresence>
      )}

      {/* Arrows — right side, bottom area. */}
      <div className="absolute bottom-24 right-6 z-20 hidden items-center gap-2 md:flex md:right-12 lg:right-20">
        <button
          type="button"
          onClick={prev}
          aria-label="Previous slide"
          className="flex h-9 w-9 items-center justify-center opacity-60 transition-opacity duration-200 ease-state hover:opacity-100"
          style={{ color: chromeHex }}
        >
          <ChevronLeft aria-hidden="true" size={20} strokeWidth={1.5} />
        </button>
        <button
          type="button"
          onClick={next}
          aria-label="Next slide"
          className="flex h-9 w-9 items-center justify-center opacity-60 transition-opacity duration-200 ease-state hover:opacity-100"
          style={{ color: chromeHex }}
        >
          <ChevronRight aria-hidden="true" size={20} strokeWidth={1.5} />
        </button>
      </div>

      {/* Line navigation, bottom-centre — segments, not dots. */}
      <div className="absolute inset-x-0 bottom-8 z-20 flex items-center justify-center gap-1.5">
        {slides.map((lineSlide, lineIndex) => (
          <button
            key={lineSlide.headline.join("-")}
            type="button"
            onClick={() => goTo(lineIndex)}
            aria-label={`Go to slide ${lineIndex + 1}`}
            aria-current={lineIndex === index || undefined}
            className="h-[2px] transition-[width,background-color,opacity] duration-300 ease-state"
            style={{
              width: lineIndex === index ? 40 : 8,
              backgroundColor: lineIndex === index ? chromeHoverHex : chromeHex,
              opacity: lineIndex === index ? 1 : 0.4,
            }}
          />
        ))}
      </div>
    </section>
  );
}
