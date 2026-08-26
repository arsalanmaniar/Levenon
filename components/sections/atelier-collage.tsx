"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { m, useScroll, useTransform } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import type { Product } from "@/lib/types";

const ENTRANCE_EASE = [0.25, 0.1, 0, 1] as const;

/**
 * Seven tiles — one large "front" photo (framed, captioned, the same
 * treatment the previous single-image version carried) centred, with six
 * smaller ones arranged around its perimeter. Revised (user feedback,
 * 2026-08-31 — "more attractive alignment") from a looser, more scattered
 * first pass: rotations tightened to a ±4° range and every supporting tile
 * now sits along a clear outer ring around the front tile with only slight,
 * deliberate overlap at the corners, rather than a denser, more chaotic
 * pile. Hand-placed percentages, the same "fills the space, looks natural,
 * not a formula" reasoning the old (now-deleted) `hero-collage.tsx` used
 * for its own five tiles.
 */
const TILES: Array<{
  className: string;
  rotate: string;
  front?: boolean;
}> = [
  { className: "left-[0%] top-[0%] h-[24%] w-[36%]", rotate: "-rotate-3" },
  { className: "left-[40%] top-[0%] h-[20%] w-[30%]", rotate: "rotate-2" },
  { className: "left-[74%] top-[2%] h-[22%] w-[26%]", rotate: "-rotate-2" },
  { className: "left-[0%] top-[52%] h-[22%] w-[28%]", rotate: "rotate-4" },
  { className: "left-[72%] top-[56%] h-[24%] w-[28%]", rotate: "-rotate-3" },
  { className: "left-[30%] top-[80%] h-[20%] w-[28%]", rotate: "rotate-3" },
  {
    className: "left-[24%] top-[22%] h-[52%] w-[52%]",
    rotate: "-rotate-1",
    front: true,
  },
];

function Tile({
  product,
  tile,
  index,
  reducedMotion,
}: {
  product: Product;
  tile: (typeof TILES)[number];
  index: number;
  reducedMotion: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const image = product.images[0];

  return (
    <m.div
      className={`group absolute overflow-visible ${tile.rotate} ${tile.className}`}
      style={{ zIndex: tile.front ? 40 : 10 + index }}
      initial={reducedMotion ? false : { clipPath: "inset(100% 0 0 0)", opacity: 0 }}
      whileInView={{ clipPath: "inset(0% 0 0 0)", opacity: 1 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.7, delay: index * 0.08, ease: ENTRANCE_EASE }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      <m.div
        className={`relative h-full w-full overflow-hidden border bg-ink ${
          tile.front ? "border-purple-500" : "border-paper/20"
        }`}
        whileHover={reducedMotion ? undefined : { scale: 1.05, zIndex: 50 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        {image && (
          <Image
            src={image.url}
            alt={image.alt || product.name}
            fill
            sizes={tile.front ? "(min-width: 1024px) 22vw, 55vw" : "(min-width: 1024px) 14vw, 35vw"}
            className="object-cover"
          />
        )}

        {tile.front && (
          <>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 outline outline-1 outline-purple-500 [outline-offset:-6px]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-ink/70 to-transparent"
            />
            <p className="absolute bottom-3 left-3 font-mono text-[10px] uppercase tracking-[0.18em] text-paper">
              Chikankari — worked by hand
            </p>
          </>
        )}
      </m.div>

      {/* Name tooltip, hover only — same idiom the previous swatch-stack
          version used, so a fan tile still identifies itself before a
          reader commits to clicking through. */}
      {hovered && !reducedMotion && (
        <m.span
          role="tooltip"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="pointer-events-none absolute -bottom-7 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-3 py-1 text-[10px] text-paper shadow-thread"
        >
          {product.name}
        </m.span>
      )}
    </m.div>
  );
}

/**
 * The atelier's left side (client brief, 2026-08-31) — was a single
 * editorial photograph; now a fanned stack of the same photograph plus six
 * more, echoing (at real scale) the original swatch-stack idea two passes
 * ago retired in favour of one image. Parallax stays on the *group*, not
 * per tile — tracking seven independent scroll transforms would be
 * expensive for a section whose whole point is a quiet ambient drift, not
 * seven competing ones.
 *
 * Parallax is element-relative (`useScroll({ target: ref })`), not the
 * document-relative `scrollY` pattern this codebase's own hero collage used
 * to use — see the previous version of this file's own note on why that
 * pattern reads wrong for a section below the fold.
 */
export function AtelierCollage({ products }: { products: Product[] }) {
  const reducedMotion = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);

  const tiles = TILES.slice(0, products.length);

  return (
    <div ref={ref} className="relative aspect-[4/5] w-full">
      <m.div className="absolute inset-0" style={reducedMotion ? undefined : { y }}>
        {tiles.map((tile, index) => {
          const product = products[index];
          if (!product) return null;
          return (
            <Tile
              key={product.id}
              product={product}
              tile={tile}
              index={index}
              reducedMotion={reducedMotion}
            />
          );
        })}
      </m.div>
    </div>
  );
}
