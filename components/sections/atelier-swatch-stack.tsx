"use client";

import Image from "next/image";
import { useState } from "react";
import { m } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import type { Product } from "@/lib/types";

// Same entrance curve as the hero collage's own clip-in tiles.
const ENTRANCE_EASE = [0.25, 0.1, 0, 1] as const;

const ROTATION = ["-rotate-3", "rotate-2", "-rotate-2"];
const OFFSET = ["left-0 top-0 z-10", "left-[34%] top-[18%] z-20", "left-[16%] top-[42%] z-30"];

function Swatch({
  product,
  index,
  reducedMotion,
}: {
  product: Product;
  index: number;
  reducedMotion: boolean;
}) {
  const image = product.images[0];
  const [hovered, setHovered] = useState(false);

  return (
    <m.div
      className={`absolute h-20 w-[120px] overflow-visible ${ROTATION[index]} ${OFFSET[index]}`}
      initial={reducedMotion ? false : { clipPath: "inset(100% 0 0 0)" }}
      whileInView={{ clipPath: "inset(0% 0 0 0)" }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.7, delay: index * 0.15, ease: ENTRANCE_EASE }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      <m.div
        className="relative h-full w-full overflow-hidden rounded-lg border-2 border-purple-500"
        whileHover={reducedMotion ? undefined : { scale: 1.05 }}
        transition={{ duration: 0.2 }}
      >
        {image ? (
          <Image src={image.url} alt="" fill sizes="120px" className="object-cover" />
        ) : (
          <div className="h-full w-full bg-ink" />
        )}
      </m.div>

      {/* Fabric-name tooltip, on hover only. */}
      {hovered && (
        <m.span
          role="tooltip"
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="pointer-events-none absolute -bottom-8 left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-3 py-1 text-footer-heading text-paper shadow-thread"
        >
          {product.name}
        </m.span>
      )}
    </m.div>
  );
}

/**
 * The atelier's left-side composition (client brief, 2026-08-27) — a large
 * decorative "01", three real-photo fabric swatches fanned in a diagonal
 * stack, and a mono caption. Replaces the previous pass's abstract SVG,
 * which the brief judged still "just... abstract CSS", not compelling
 * enough. Products are fetched server-side by `SignatureSection` and passed
 * in — this stays a thin client island for the scroll-triggered animation
 * only, the same "server fetches, client animates" split every other
 * section on this site already uses.
 */
export function AtelierSwatchStack({ products }: { products: Product[] }) {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div className="relative aspect-[4/5] w-full max-w-[380px]">
      {/* The "01" — decorative, not readable text, hence `aria-hidden`. */}
      <m.span
        aria-hidden="true"
        className="pointer-events-none absolute -left-3 top-0 select-none font-display text-[clamp(11.25rem,20vw,17.5rem)] font-extrabold leading-[0.8] text-purple-700"
        initial={reducedMotion ? { opacity: 0.2 } : { opacity: 0 }}
        whileInView={{ opacity: 0.2 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
      >
        01
      </m.span>

      <div className="absolute inset-x-0 top-[38%] h-[210px]">
        {products.map((product, index) => (
          <Swatch key={product.id} product={product} index={index} reducedMotion={reducedMotion} />
        ))}
      </div>

      <p className="absolute bottom-2 left-1 font-mono text-[clamp(0.625rem,1vw,0.6875rem)] uppercase tracking-[0.2em] text-purple-300">
        Fabric. Before fashion.
      </p>
    </div>
  );
}
