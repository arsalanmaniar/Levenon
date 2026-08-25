"use client";

import Link from "next/link";
import { useCallback } from "react";
import { m, useMotionValue, useSpring, useTransform } from "framer-motion";
import { GRID_IMAGE_SIZES, ProductMedia } from "./product-media";
import { cn } from "@/lib/cn";
import { WishlistHeart } from "@/components/wishlist/wishlist-heart";
import { CardSpotlight } from "@/components/ui/card-spotlight";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  allSizes,
  availableSizes,
  formatPrice,
  isInStock,
  type Product,
} from "@/lib/types";

// Max lean, in degrees. Past ~8° the card stops reading as a garment on a
// surface and starts reading as a toy (SKILL.md §7).
const MAX_TILT = 8;

// Damped, no overshoot — the brand does not bounce.
const SPRING = { stiffness: 140, damping: 22, mass: 0.4 } as const;

export function ProductCard({
  product,
  /** Set on above-the-fold cards so their imagery is not lazy-loaded. */
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  const reducedMotion = usePrefersReducedMotion();
  // Stock and sizes are derived from the variant rows — a garment is in stock
  // in a size, never in general.
  const sizes = allSizes(product);
  const stocked = new Set(availableSizes(product));
  const inStock = isInStock(product);
  // Shared subscription — one listener for the whole grid, not one per card.
  const finePointer = useMediaQuery("(pointer: fine)");

  const tiltEnabled = finePointer && !reducedMotion;

  // -0.5..0.5 across the card. Motion values, so pointer movement never
  // triggers a React render.
  const px = useMotionValue(0);
  const py = useMotionValue(0);

  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [MAX_TILT, -MAX_TILT]), SPRING);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-MAX_TILT, MAX_TILT]), SPRING);
  const liftZ = useSpring(useMotionValue(0), SPRING);
  // Image-only hover scale. Driven by the same motion-value spring as the
  // tilt lift rather than a Tailwind `group-hover:scale-*` class: framer
  // writes `transform` inline on this element for `z`/tilt, which would
  // silently win over any CSS class targeting the same property.
  const imageScale = useSpring(useMotionValue(1), SPRING);

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (!tiltEnabled) return;
      const rect = event.currentTarget.getBoundingClientRect();
      px.set((event.clientX - rect.left) / rect.width - 0.5);
      py.set((event.clientY - rect.top) / rect.height - 0.5);
    },
    [px, py, tiltEnabled],
  );

  const handleEnter = useCallback(() => {
    if (tiltEnabled) liftZ.set(18);
    if (!reducedMotion) imageScale.set(1.05);
  }, [liftZ, imageScale, reducedMotion, tiltEnabled]);

  const handleLeave = useCallback(() => {
    px.set(0);
    py.set(0);
    liftZ.set(0);
    imageScale.set(1);
  }, [imageScale, liftZ, px, py]);

  return (
    <article
      className="group [perspective:1100px]"
      onPointerMove={handlePointerMove}
      onPointerEnter={handleEnter}
      onPointerLeave={handleLeave}
    >
      <m.div
        style={
          tiltEnabled
            ? { rotateX, rotateY, transformStyle: "preserve-3d" }
            : undefined
        }
        className="relative"
      >
        <Link
          href={`/product/${product.slug}`}
          className="block focus-visible:outline-offset-4"
          aria-label={`${product.name} — ${formatPrice(product)}`}
        >
          <CardSpotlight className="relative aspect-[4/5] overflow-hidden border border-hairline bg-paper shadow-[0_0_0_rgba(0,0,0,0)] transition-[border-color,box-shadow] duration-300 ease-state group-hover:border-purple-500/40 group-hover:shadow-thread">
            <m.div
              style={{ z: tiltEnabled ? liftZ : undefined, scale: imageScale }}
              // `isolate`: the hover-swap second image is a `-z-10` child and
              // needs a stacking context here to paint above the card's
              // `bg-paper` rather than behind it. Framer's own transform
              // would usually create one, but that is not guaranteed before
              // hydration — this makes it explicit rather than incidental.
              className="absolute inset-0 isolate"
            >
              <ProductMedia
                product={product}
                sizes={GRID_IMAGE_SIZES}
                priority={priority}
                hoverSwap
              />
            </m.div>

            <ThreadRing />

            {/*
              Badges quieted (2026-08-24): the category tag dropped its solid
              purple fill (purple is reserved for accents/active states, not
              a label every card carries) and both tags dropped their pill
              shape for a plain small square label — still `label` scale
              (11px mono, tracked caps) but reading as a caption over the
              photo rather than a UI chip competing with it. The SKU tag that
              used to sit top-right is gone from the grid entirely: a raw
              product code on every tile is a developer-facing detail, not a
              shopper-facing one — it stays on the PDP, where a customer
              might actually reference it (returns, sizing questions).
            */}
            {/*
              `bg-paper/90` rather than `bg-paper/80 backdrop-blur-[2px]`.
              `backdrop-filter` forces the compositor to sample and blur the
              image behind every badge, and there are two per card across a
              12-card grid; profiling a phone put Style & Layout at 1413 ms,
              second only to script evaluation. At this size the extra 10%
              opacity is visually indistinguishable from the blur and costs
              nothing to paint.
            */}
            <span className="absolute left-4 top-4 flex flex-wrap gap-1.5">
              {/* Prominent, filled — every piece here is unstitched cloth,
                  and the client brief (2026-08-24) wants that led with, not
                  buried below the fold of the card. Solid ink, not the quiet
                  paper/90 caption treatment the tags beside it use. */}
              <span className="label bg-ink px-2.5 py-1 text-paper">
                Unstitched
              </span>
              {!inStock && (
                <span className="label bg-paper/90 px-2.5 py-1 text-charcoal">
                  Waitlist
                </span>
              )}
              <span className="label bg-paper/90 px-2.5 py-1 text-charcoal">
                {product.category.name}
              </span>
            </span>

            {/* Sits outside the Link's flow so saving never navigates. */}
            <WishlistHeart product={product} className="absolute bottom-4 right-4" />
          </CardSpotlight>

          {/*
            Stacked below `sm`, side by side from `sm` up.

            Measured: in the two-column mobile grid a card is ~170px wide, and
            a `whitespace-nowrap` price ("PKR 5,434" at 16px mono) sitting in
            the same flex row as the name pushed the document 37px wider than
            the viewport at 375px — a real horizontal scroll on the home page,
            caught by an overflow sweep rather than by eye.
          */}
          <div className="mt-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
            <h3 className="font-display text-lg font-bold tracking-[-0.02em]">
              {product.name}
            </h3>
            {/* Manrope 600/16px, purple-500 (client brief, 2026-08-24) — the
                price now reads as the card's second-loudest element after
                the name, not a quiet mono aside. */}
            <span className="font-display text-base font-semibold tracking-tight text-purple-500 sm:whitespace-nowrap">
              {formatPrice(product)}
            </span>
          </div>

          <p className="mt-2 max-w-measure text-sm leading-relaxed text-charcoal">
            {product.blurb}
          </p>

          <ul className="mt-4 flex flex-wrap gap-2" aria-label="Sizes">
            {sizes.map((size) => {
              const available = stocked.has(size);
              // A one-variant piece's only "size" is the descriptor that
              // matters most here — it is unstitched cloth, not a garment —
              // so that specific chip earns the card's strongest treatment
              // rather than reading as one option among several.
              const isUnstitchedDescriptor = sizes.length === 1 && size === "Unstitched";
              return (
                <li
                  key={size}
                  className={cn(
                    "label rounded-full border px-2.5 py-1",
                    isUnstitchedDescriptor
                      ? "border-ink bg-ink text-paper"
                      : available
                        ? "border-hairline text-charcoal"
                        : // Sold out: a dashed edge — the stitch motif doing
                          // the work. A strike-through over an 11px mono
                          // glyph is unreadable, and the state is spelled out
                          // for screen readers rather than carried by colour
                          // alone.
                          "border-dashed border-hairline text-charcoal",
                  )}
                >
                  {size}
                  {!available && <span className="sr-only"> — sold out</span>}
                </li>
              );
            })}
          </ul>

          {/* The thread motif as a hover state: a line drawing itself across
              the bottom of the card, left to right. */}
          <span
            aria-hidden="true"
            className="mt-5 block h-px w-full origin-left scale-x-0 bg-purple-500 transition-transform duration-300 ease-enter group-hover:scale-x-100"
          />
        </Link>
      </m.div>
    </article>
  );
}

/**
 * The ring motif, laid over the garment on hover.
 *
 * The brief asked for this *behind* the image. It cannot go there: the tile is
 * `object-cover` at 4:5, so real photography covers the frame edge to edge and
 * anything underneath it is simply invisible. Sitting it above the photo as an
 * unfilled hairline stroke keeps the intent — the ring appears on hover and
 * scales up — while actually being seen, and it reads as a thread laid across
 * the cloth, which is closer to the motif than a hidden layer would have been.
 *
 * Pure CSS and SVG: no state, no listener, nothing for React to re-render, so a
 * pointer crossing a twelve-card grid costs nothing. `ease-state` and 200 ms
 * are the §7 values for a state change.
 *
 * Under reduced motion the ring still answers the hover — it simply arrives at
 * full size with no transition, which is §7's "never construct the animation"
 * rather than a zero-duration one.
 */
function ThreadRing() {
  return (
    <svg
      viewBox="0 0 100 125"
      fill="none"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full scale-[0.85] text-purple-300 opacity-0 transition-[transform,opacity] duration-200 ease-state group-hover:scale-100 group-hover:opacity-100 motion-reduce:scale-100 motion-reduce:transition-none"
    >
      <circle
        cx="50"
        cy="62.5"
        r="26"
        stroke="currentColor"
        strokeWidth="0.6"
        strokeOpacity="0.85"
      />
      {/* The open tail of the "e" — the ring is a thread, not a circle. */}
      <path
        d="M50 36.5a26 26 0 0 1 26 26"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}
