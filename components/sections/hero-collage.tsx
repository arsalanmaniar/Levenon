"use client";

import Image from "next/image";
import { m, useScroll, useTransform } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import type { Product } from "@/lib/types";

/**
 * Five tiles (client brief, 2026-08-26, up from 3): 2 larger on the left,
 * 3 smaller stacked on the right, all fanned -4°..+4° and overlapping enough
 * that the box fills edge to edge with no dead margin. Position/size/rotation
 * are hand-placed percentages rather than a formula — the ask was "fills the
 * space, looks natural," not a computed grid.
 */
const ROTATION = ["-rotate-3", "rotate-2", "rotate-4", "-rotate-3", "rotate-2"];
const PLACEMENT = [
  "left-0 top-0 h-[54%] w-[56%] z-10", // left column, upper
  "left-[4%] top-[44%] h-[54%] w-[54%] z-20", // left column, lower
  "left-[54%] top-0 h-[30%] w-[46%] z-30", // right column, upper
  "left-[58%] top-[26%] h-[30%] w-[42%] z-[15]", // right column, middle
  "left-[52%] top-[54%] h-[44%] w-[48%] z-25", // right column, lower
];
// Alternating direction per card (client brief, 2026-08-25) — so the five
// never pulse in lockstep.
const KEN_BURNS = [
  "animate-ken-burns",
  "animate-ken-burns-reverse",
  "animate-ken-burns",
  "animate-ken-burns-reverse",
  "animate-ken-burns",
];
// Top-row tiles move the most on scroll, the bottom-row the least — "top
// image moves up slightly faster than bottom" from the original brief,
// extended across all five.
const PARALLAX_RANGE: [number, number][] = [
  [-20, 20],
  [-8, 8],
  [-22, 22],
  [-12, 12],
  [-6, 6],
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
      className={`absolute overflow-hidden border border-hairline bg-paper shadow-[0_24px_48px_-20px_rgba(20,15,10,0.4)] ${ROTATION[index]} ${PLACEMENT[index]}`}
      style={reducedMotion ? undefined : { y }}
      initial={reducedMotion ? false : { clipPath: "inset(100% 0 0 0)" }}
      animate={{ clipPath: "inset(0% 0 0 0)" }}
      transition={{ duration: 0.7, delay: index * 0.12, ease: ENTRANCE_EASE }}
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
              sizes="(min-width: 1024px) 340px, (min-width: 640px) 45vw, 60vw"
              priority={index < 2}
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
    <div className="relative mx-auto w-full max-w-[460px] py-6 pl-8 sm:max-w-[520px] lg:max-w-[580px] lg:py-0">
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

      {/* Taller than the previous 4:5 single stack — five tiles across two
          sub-columns need the extra height to fill without crowding
          (client brief, 2026-08-26: "no empty space around it"). */}
      <div className="relative aspect-[4/5.6] w-full">
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
