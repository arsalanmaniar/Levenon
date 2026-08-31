"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { m, useMotionValue, useSpring, useTransform } from "framer-motion";
import { GRID_IMAGE_SIZES, ProductMedia } from "./product-media";
import { cn } from "@/lib/cn";
import { useCart } from "@/components/cart/cart-provider";
import { WishlistHeart } from "@/components/wishlist/wishlist-heart";
import { LowStockBadge } from "./low-stock-badge";
import { CardSpotlight } from "@/components/ui/card-spotlight";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { useMediaQuery } from "@/hooks/use-media-query";
import { allSizes, formatPrice, isInStock, type Product } from "@/lib/types";

// Max lean, in degrees. Past ~8° the card stops reading as a garment on a
// surface and starts reading as a toy (SKILL.md §7).
const MAX_TILT = 8;

// Damped, no overshoot — the brand does not bounce.
const SPRING = { stiffness: 140, damping: 22, mass: 0.4 } as const;

export function ProductCard({
  product,
  /** Set on above-the-fold cards so their imagery is not lazy-loaded. */
  priority = false,
  /**
   * True for the first eight rows of the *default* catalogue order (client
   * brief, 2026-08-29: "NEW badge... if within first 8 in catalogue array").
   * Computed by the caller, not here — this component has no server access
   * to the unfiltered array, and the callers that already read it (the
   * collection grid, Top Selling) are cheaply positioned to check membership
   * once per page rather than this card re-deriving it per render.
   */
  isNew = false,
}: {
  product: Product;
  priority?: boolean;
  isNew?: boolean;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const { addVariant } = useCart();
  // Stock and sizes are derived from the variant rows — a garment is in stock
  // in a size, never in general.
  const sizes = allSizes(product);
  const inStock = isInStock(product);
  const totalStock = product.variants.reduce((sum, variant) => sum + variant.stockOnHand, 0);
  const hasSecondImage = Boolean(product.images[1]);
  // Shared subscription — one listener for the whole grid, not one per card.
  const finePointer = useMediaQuery("(pointer: fine)");

  const tiltEnabled = finePointer && !reducedMotion;

  const [picking, setPicking] = useState(false);

  const handleQuickAdd = useCallback(
    (size: (typeof sizes)[number]) => {
      const variant = product.variants.find((candidate) => candidate.size === size);
      if (!variant || variant.stockOnHand === 0) return;
      addVariant(product, variant);
      setPicking(false);
    },
    [addVariant, product],
  );

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
    // Zoom is the fallback affordance for a single-image card only — a card
    // with a second frame gets the cross-fade instead (client brief,
    // 2026-08-29). Both at once fought for attention in review.
    if (!reducedMotion && !hasSecondImage) imageScale.set(1.05);
  }, [liftZ, imageScale, reducedMotion, tiltEnabled, hasSecondImage]);

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
          {/* 3:4, up from 4:5 (client brief, 2026-08-29) — taller reads
              closer to fashion photography than the previous, squarer frame. */}
          <CardSpotlight className="group/image relative aspect-[3/4] overflow-hidden border border-hairline bg-paper shadow-[0_0_0_rgba(0,0,0,0)] transition-[border-color,box-shadow] duration-300 ease-state group-hover:border-purple-500/40 group-hover:shadow-thread">
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
              Badge scheme rebuilt (client brief, 2026-08-29): the image now
              carries only status (NEW, sold out) top-left and urgency
              bottom-left. "Unstitched" and the fabric category moved to the
              card body below, as a quiet pill and a mono caption — see
              there. Solid tint rather than `backdrop-blur` on the surviving
              badge: see the profiling note this card already carried for
              why (Style & Layout cost across a full grid).
            */}
            <span className="absolute left-4 top-4 flex flex-wrap gap-1.5">
              {isNew && (
                <span className="label bg-purple-500 px-2.5 py-1 text-paper">New</span>
              )}
              {!inStock && (
                <span className="label bg-paper/90 px-2.5 py-1 text-charcoal">
                  Waitlist
                </span>
              )}
            </span>

            {/* Top-right, always visible (client brief, 2026-08-29) — was
                bottom-right, freed by the badge reshuffle above. */}
            <WishlistHeart product={product} className="absolute right-4 top-4" />

            {/* `bottom-12`, not `bottom-4` — the Quick Add bar below claims
                the image's true bottom edge full-width (36px tall), so a
                flush bottom-left badge would sit underneath it whenever
                both are visible, which for this badge is always (it only
                renders for in-stock rows, and Quick Add always renders for
                those too). Raised to clear it rather than the two
                fighting for the same strip. */}
            <LowStockBadge stockOnHand={totalStock} className="absolute bottom-12 left-4" />

            {/*
              Quick Add — bottom of the image, full width, 36px (client
              brief, 2026-08-29). Lives inside the `Link` for the same reason
              `WishlistHeart` already does: every control here stops its own
              click from navigating, rather than the whole card being
              restructured around it. Hover-revealed on a fine pointer only;
              always present below `lg`, where there is no hover to reveal
              it from (same rule `NewArrivalCard`'s own trigger already uses).
            */}
            {inStock && (
              <div
                className="absolute inset-x-0 bottom-0 opacity-100 transition-opacity duration-200 ease-state lg:opacity-0 lg:group-hover:opacity-100"
                onClick={(event) => event.preventDefault()}
              >
                {picking ? (
                  <div className="flex flex-wrap items-center gap-1.5 bg-ink/80 p-2 backdrop-blur-sm">
                    {sizes.map((size) => {
                      const variant = product.variants.find(
                        (candidate) => candidate.size === size,
                      );
                      const available = (variant?.stockOnHand ?? 0) > 0;
                      return (
                        <button
                          key={size}
                          type="button"
                          disabled={!available}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            handleQuickAdd(size);
                          }}
                          className={cn(
                            "label rounded-full border px-2.5 py-1 transition-colors duration-200 ease-state",
                            available
                              ? "border-paper/40 text-paper hover:border-paper hover:bg-paper hover:text-ink"
                              : "cursor-not-allowed border-dashed border-paper/20 text-paper/40",
                          )}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      if (sizes.length === 1) handleQuickAdd(sizes[0]);
                      else setPicking(true);
                    }}
                    className="label flex h-9 w-full items-center justify-center bg-ink/80 text-paper backdrop-blur-sm transition-colors duration-200 ease-state hover:bg-ink"
                  >
                    Add to Bag — select size
                  </button>
                )}
              </div>
            )}
          </CardSpotlight>

          {/* Card body — name, fabric, price, "Unstitched" pill (client
              brief, 2026-08-29). The previous blurb paragraph and the static
              size-chip row are both gone: Quick Add above now surfaces sizes
              on demand, and a premium grid card carries a fact line, not a
              sentence — keeping both was the clutter the brief's reference
              sites (Maria B, Sapphire) don't have. */}
          <div className="mt-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="line-clamp-2 font-display text-[14px] font-semibold leading-snug tracking-[-0.01em] text-ink">
                {product.name}
              </h3>
              {/* 700/15px/ink, not purple (client brief, 2026-08-29) —
                  purple-500 is reserved for accents/hover, not body-weight
                  price text. */}
              <span className="shrink-0 font-display text-[15px] font-bold tracking-tight text-ink">
                {formatPrice(product)}
              </span>
            </div>

            <p className="label mt-1.5 text-[10px] text-charcoal">
              {product.category.name}
            </p>

            <span className="label mt-3 inline-flex rounded-full border border-hairline px-2 py-0.5 text-[10px] text-charcoal">
              Unstitched
            </span>
          </div>

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
 *
 * **Trigger scoped to `group/image` (client brief, 2026-08-30), not the
 * card-wide `group`.** `CardSpotlight` — the `aspect-[3/4]` image tile this
 * ring already lives inside — now carries that named group, so the ring only
 * answers a pointer over the photo itself; hovering the name/price/category
 * text below the image (a sibling of `CardSpotlight`, outside this element's
 * `absolute inset-0`, so it was never visually reachable by a hover starting
 * there) no longer triggers it either. Narrower trigger surface, same visual
 * placement.
 */
function ThreadRing() {
  return (
    <svg
      viewBox="0 0 100 125"
      fill="none"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full scale-[0.85] text-purple-300 opacity-0 transition-[transform,opacity] duration-200 ease-state group-hover/image:scale-100 group-hover/image:opacity-100 motion-reduce:scale-100 motion-reduce:transition-none"
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
