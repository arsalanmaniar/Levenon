"use client";

import Image from "next/image";
import { m, useScroll, useTransform } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import type { Product } from "@/lib/types";

/**
 * Slight rotation, per tile — CSS only, matches the client brief's literal
 * `-3deg / 0 / +3deg` fan.
 */
const ROTATION = ["-rotate-3", "rotate-0", "rotate-3"];
const OFFSET = [
  "left-0 top-0 z-0",
  "left-[14%] top-[10%] z-10",
  "left-[28%] top-[20%] z-20",
];
// Alternating direction per card (client brief, 2026-08-25) — even tiles zoom
// in then out, the middle tile does the reverse phase, so the three never
// pulse in lockstep.
const KEN_BURNS = ["animate-ken-burns", "animate-ken-burns-reverse", "animate-ken-burns"];
// Top tile (index 0) moves the most on scroll, the lowest the least — "top
// image moves up slightly faster than bottom" from the brief.
const PARALLAX_RANGE: [number, number][] = [
  [-20, 20],
  [-13, 13],
  [-7, 7],
];

const ENTRANCE_EASE = [0.25, 0.1, 0, 1] as const;
const BRAND_EASE = [0.16, 1, 0.3, 1] as const;

function CollageTile({
  product,
  index,
  reducedMotion,
  scrollY,
}: {
  product: Product;
  index: number;
  reducedMotion: boolean;
  scrollY: ReturnType<typeof useScroll>["scrollY"];
}) {
  const image = product.images[0];
  const [from, to] = PARALLAX_RANGE[index];
  const y = useTransform(scrollY, [0, 600], [from, to]);

  return (
    <m.div
      className={`absolute h-[64%] w-[64%] overflow-hidden border border-hairline bg-paper shadow-[0_24px_48px_-20px_rgba(20,15,10,0.4)] ${ROTATION[index]} ${OFFSET[index]}`}
      style={reducedMotion ? undefined : { y }}
      initial={reducedMotion ? false : { clipPath: "inset(100% 0 0 0)" }}
      animate={{ clipPath: "inset(0% 0 0 0)" }}
      transition={{ duration: 0.7, delay: index * 0.15, ease: ENTRANCE_EASE }}
    >
      {/* Hover layer — scoped to this one tile via its own `group`, scaling
          the fabric up 1.04× to reveal more of it. Separate from the Ken
          Burns layer below so the two `transform`s don't fight over the
          same element. */}
      <div className="group/tile h-full w-full">
        <div className="h-full w-full transition-transform duration-500 ease-out group-hover/tile:scale-[1.04]">
          {/* Ken Burns — a slow, continuous ambient zoom, independent of
              hover. `motion-reduce:animate-none` stops it outright rather
              than merely slowing it, per SKILL.md §7. */}
          <div className={`h-full w-full ${reducedMotion ? "" : KEN_BURNS[index]} motion-reduce:animate-none`}>
            <Image
              src={image.url}
              alt={image.alt || product.name}
              fill
              sizes="(min-width: 1024px) 480px, (min-width: 640px) 60vw, 80vw"
              priority={index === 0}
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </m.div>
  );
}

export function HeroCollage({ products }: { products: Product[] }) {
  const reducedMotion = usePrefersReducedMotion();
  const { scrollY } = useScroll();

  return (
    <div className="relative mx-auto w-full max-w-[420px] py-6 pl-8 sm:max-w-[460px] lg:max-w-[480px] lg:py-0">
      {/* Thread motif — a single hairline-width purple rule down the
          collage's left edge. Grows from 0→100% height on load rather than
          a static line (client brief, 2026-08-25). */}
      <m.div
        aria-hidden="true"
        className="absolute bottom-6 left-0 top-6 w-px origin-top bg-purple-500 lg:bottom-0 lg:top-0"
        initial={reducedMotion ? false : { scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.6, delay: 0.4, ease: BRAND_EASE }}
      />

      <div className="relative aspect-[4/5] w-full">
        {products.map((product, index) => (
          <CollageTile
            key={product.id}
            product={product}
            index={index}
            reducedMotion={reducedMotion}
            scrollY={scrollY}
          />
        ))}
      </div>

      <m.p
        className="mt-6 pl-2 font-mono text-xs tracking-wide text-charcoal"
        initial={reducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.9, ease: BRAND_EASE }}
      >
        48 pieces. 6 fabrics. One edit.
      </m.p>
    </div>
  );
}
