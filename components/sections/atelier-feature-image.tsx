"use client";

import Image from "next/image";
import { useRef } from "react";
import { m, useScroll, useTransform } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import type { Product } from "@/lib/types";

const ENTRANCE_EASE = [0.25, 0.1, 0, 1] as const;

/**
 * The atelier's left-side image (client brief, 2026-08-29) — replaces the
 * previous pass's "01" numeral + fanned fabric-swatch stack entirely. That
 * composition read as amateur CSS decoration; this is one large editorial
 * photograph, in the register Maria B / Sapphire's own campaign sections
 * use — a single striking piece, not a collage standing in for one.
 *
 * Parallax is **element-relative** (`useScroll({ target: ref })`), not the
 * document-relative `scrollY` `hero-collage.tsx` uses. That pattern maps a
 * fixed `[0, 600]` window of *page* scroll, which only reads correctly for
 * an element near the top of the document — the atelier sits well below the
 * fold, so reusing it verbatim would have shipped a parallax already pinned
 * at its end value before the section ever scrolled into view. This is the
 * brief's own named "fixed bug": tracking the element's own transit through
 * the viewport instead, via `offset: ["start end", "end start"]`.
 *
 * "0.7× scroll speed": the frame overscans its image by 30% top and bottom
 * (`h-[130%]`) and translates it across a matching ±15% range as the section
 * transits the viewport — the image travels 30% less than the frame itself
 * does, which is what "moves at 70% of scroll speed" means for a bounded
 * container rather than an unbounded background layer.
 */
export function AtelierFeatureImage({ product }: { product: Product }) {
  const reducedMotion = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);

  const image = product.images[0];

  return (
    <div ref={ref} className="relative aspect-[3/4] w-full overflow-hidden">
      {image && (
        // Clip-in from bottom on scroll into view — the same entrance
        // `hero-collage.tsx`'s tiles already use.
        <m.div
          className="absolute inset-0"
          initial={reducedMotion ? false : { clipPath: "inset(100% 0 0 0)" }}
          whileInView={{ clipPath: "inset(0% 0 0 0)" }}
          viewport={{ once: true, margin: "0px 0px -10% 0px" }}
          transition={{ duration: 0.8, ease: ENTRANCE_EASE }}
        >
          <m.div
            className="absolute inset-x-0 -top-[15%] h-[130%]"
            style={reducedMotion ? undefined : { y }}
          >
            <Image
              src={image.url}
              alt={image.alt || product.name}
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
            />
          </m.div>
        </m.div>
      )}

      {/* Thin purple-500 frame, inset 8px from the true edges — CSS
          `outline` with a negative offset, not `box-shadow` (client brief). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 outline outline-1 outline-purple-500 [outline-offset:-8px]"
      />

      {/* Scrim so the mono caption reads against any photograph. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-ink/60 to-transparent"
      />

      <p className="absolute bottom-4 left-4 font-mono text-[10px] uppercase tracking-[0.18em] text-paper">
        Chikankari — worked by hand
      </p>
    </div>
  );
}
