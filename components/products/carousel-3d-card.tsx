"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { formatPrice, type Product } from "@/lib/types";

export type Carousel3DBand = { opacity: number; scale: number; brightness: number };

/**
 * One tile in the 360° 3D ring (client brief, 2026-08-31; rotation math
 * rewritten 2026-09-02 for the `useAnimationFrame` auto-spin fix — see
 * `new-arrivals-carousel.tsx`'s own doc comment for why). Deliberately much
 * simpler than `NewArrivalCard` (the flat-scroll fallback's card) — no
 * quick-add, no wishlist heart, no badges: the brief's own "card appearance
 * in 3D space" asks for exactly two things, an image and a hover/active
 * name+price overlay, and a quick-add size-picker has nowhere sane to
 * render on a card this small mid-rotation.
 *
 * `placementDeg = cardIndex·stepDeg − displayAngle` — the live ring angle
 * folded straight into each card's own placement rather than applied once
 * on an outer wrapper, which is what makes the counter-rotation
 * (`rotateY(placementDeg) translateZ(radius) rotateY(−placementDeg)`) real
 * billboarding: as `displayAngle` advances every animation frame, a card's
 * position *and* the angle it must cancel to face the viewer both move
 * together, so it stays face-on at every point in the spin, not just at
 * the front position.
 *
 * Positioning transform has **no CSS transition** — it changes every
 * animation frame, and transitioning a value that's already being updated
 * 60 times a second only makes the card visibly lag behind the ring
 * instead of moving with it. The opacity/scale/brightness *band* (which
 * only changes when the front card changes, every couple of seconds) lives
 * on a separate inner element specifically so *it* can keep a smooth
 * transition without inheriting that problem.
 */
export function Carousel3DCard({
  product,
  cardIndex,
  stepDeg,
  displayAngle,
  isActive,
  band,
  onFocusCard,
  priority,
}: {
  product: Product;
  cardIndex: number;
  stepDeg: number;
  displayAngle: number;
  isActive: boolean;
  band: Carousel3DBand;
  onFocusCard: (index: number) => void;
  priority: boolean;
}) {
  const image = product.images[0];
  const placementDeg = cardIndex * stepDeg - displayAngle;

  return (
    <div
      className="carousel-3d-card"
      style={{
        transform: `rotateY(${placementDeg}deg) translateZ(var(--carousel-radius)) rotateY(${-placementDeg}deg)`,
      }}
    >
      <div
        className="h-full w-full transition-[opacity,transform,filter] duration-500 ease-state"
        style={{
          opacity: band.opacity,
          transform: `scale(${band.scale})`,
          filter: `brightness(${band.brightness})`,
        }}
      >
        <Link
          href={`/product/${product.slug}`}
          onClick={(event) => {
            // The front card navigates normally; any other card brings
            // itself to front instead of jumping straight to its PDP.
            if (!isActive) {
              event.preventDefault();
              onFocusCard(cardIndex);
            }
          }}
          aria-label={`${product.name} — ${formatPrice(product)}`}
          className={cn(
            "group relative block h-full w-full overflow-hidden border border-transparent bg-paper transition-[border-color,box-shadow] duration-300 ease-state",
            isActive && "border-purple-500 shadow-[0_0_40px_rgba(124,42,232,0.4)]",
          )}
        >
          {image && (
            <Image
              src={image.url}
              alt={image.alt || product.name}
              fill
              priority={priority}
              sizes="200px"
              className="object-cover"
            />
          )}
          <div
            className={cn(
              "absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 to-transparent px-3 pb-3 pt-8 opacity-0 transition-opacity duration-300 ease-state group-hover:opacity-100",
              isActive && "opacity-100",
            )}
          >
            <p className="line-clamp-1 font-display text-[12px] font-semibold text-paper">
              {product.name}
            </p>
            <p className="mt-0.5 font-display text-[12px] font-bold text-paper/90">
              {formatPrice(product)}
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
